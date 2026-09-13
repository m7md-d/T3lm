/* أصغرُ VFS يعمل: عقدٌ في الذاكرة، وجدولُ فتحاتٍ عامّ، وواجهةٌ من أربع.
   ولا نقلّد Linux: لا dentry ولا mount ولا superblock — ولا حاجةَ إليها
   ما دام هناك نظامُ ملفّاتٍ واحدٌ بلا مجلّدات. */
#include "vfs.h"
#include "kheap.h"
#include "string.h"
#include "log.h"

static struct inode nodes[VFS_MAX_NODES];
static struct file  files[VFS_MAX_FILES];

void vfs_init(void) {
    memset(nodes, 0, sizeof nodes);
    memset(files, 0, sizeof files);
}

struct inode *vfs_node(int i)  { return &nodes[i]; }
struct file  *vfs_file(int fh) { return (fh >= 0 && fh < VFS_MAX_FILES) ? &files[fh] : NULL; }
int vfs_node_count(void) {
    int n = 0; for (int i = 0; i < VFS_MAX_NODES; i++) if (nodes[i].used) n++;
    return n;
}

struct inode *vfs_create(const char *name, size_t cap) {
    for (int i = 0; i < VFS_MAX_NODES; i++) {
        if (nodes[i].used) continue;
        struct inode *n = &nodes[i];
        size_t len = strlen(name);
        if (len >= VFS_NAME) len = VFS_NAME - 1;
        memcpy(n->name, name, len); n->name[len] = 0;
        n->data = cap ? kmalloc(cap) : NULL;
        n->size = 0; n->cap = cap; n->used = true;
        n->dev_read = NULL; n->dev_write = NULL; n->priv = NULL;
        return n;
    }
    return NULL;
}

struct inode *vfs_lookup(const char *name) {
    for (int i = 0; i < VFS_MAX_NODES; i++)
        if (nodes[i].used && !strcmp(nodes[i].name, name)) return &nodes[i];
    return NULL;
}

int vfs_open(const char *name) {
    struct inode *n = vfs_lookup(name);
    if (!n) return -2;                              /* ENOENT */
    for (int i = 0; i < VFS_MAX_FILES; i++) {
        if (files[i].used) continue;
        files[i] = (struct file){ .ino = n, .pos = 0, .used = true, .refs = 1 };
        return i;
    }
    return -24;                                     /* EMFILE */
}

int64_t vfs_read(int fh, void *buf, size_t n) {
    struct file *f = vfs_file(fh);
    if (!f || !f->used) return -9;                  /* EBADF */
    if (f->ino->dev_read) return f->ino->dev_read(f->ino, buf, n);
    if (f->pos >= f->ino->size) return 0;           /* نهايةُ الملفّ */
    size_t left = f->ino->size - f->pos;
    if (n > left) n = left;
    memcpy(buf, f->ino->data + f->pos, n);
    f->pos += n;
    return (int64_t)n;
}

int64_t vfs_write(int fh, const void *buf, size_t n) {
    struct file *f = vfs_file(fh);
    if (!f || !f->used) return -9;
    if (f->ino->dev_write) return f->ino->dev_write(f->ino, buf, n);
    if (!f->ino->data) return -13;                  /* EACCES: جهازٌ لا يُكتَب */
    if (f->pos + n > f->ino->cap) n = f->ino->cap - f->pos;
    memcpy(f->ino->data + f->pos, buf, n);
    f->pos += n;
    if (f->pos > f->ino->size) f->ino->size = f->pos;
    return (int64_t)n;
}

int vfs_close(int fh) {
    struct file *f = vfs_file(fh);
    if (!f || !f->used) return -9;
    if (--f->refs == 0) f->used = false;            /* الفتحةُ تُغلَق، والعقدةُ تبقى */
    return 0;
}
