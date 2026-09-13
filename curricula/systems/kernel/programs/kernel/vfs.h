#ifndef VFS_H
#define VFS_H
#include "kernel.h"

#define VFS_MAX_NODES 8
#define VFS_MAX_FILES 16
#define VFS_NAME 24

/* العقدة: ما يوجد. والملفّ: فتحةٌ عليه بموضع قراءة.
   والوصف: فهرسٌ في جدول العملية. ثلاثةٌ تُخلَط وهي مستقلّة. */
struct inode {
    char     name[VFS_NAME];
    uint8_t *data;
    size_t   size, cap;
    bool     used;
    /* جهازٌ لا بياناتٌ: تُنادى بدل القراءة من `data` */
    int64_t (*dev_read)(struct inode *, void *buf, size_t n);
    int64_t (*dev_write)(struct inode *, const void *buf, size_t n);
    void    *priv;
};

struct file {
    struct inode *ino;
    size_t   pos;
    bool     used;
    int      refs;
};

void          vfs_init(void);
struct inode *vfs_create(const char *name, size_t cap);
struct inode *vfs_lookup(const char *name);
int           vfs_open(const char *name);      /* فهرسٌ في جدول الملفّات العامّ */
int64_t       vfs_read(int fh, void *buf, size_t n);
int64_t       vfs_write(int fh, const void *buf, size_t n);
int           vfs_close(int fh);
struct inode *vfs_node(int i);
struct file  *vfs_file(int fh);
int           vfs_node_count(void);
#endif
