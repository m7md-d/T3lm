/* واجهة بروتوكول Limine — مُعلَنةٌ بيدنا لا مستوردة.
   كل رقمٍ هنا منقولٌ من PROTOCOL.md، ولا شيء فيه سحر:
   الطلب بنيةٌ نضعها في صورة الكيرنل، والـbootloader يبحث عنها بالـid
   ويملأ `response` قبل أن ينقل التنفيذ إلينا. */
#ifndef LIMINE_H
#define LIMINE_H
#include <stdint.h>

#define LIMINE_COMMON_MAGIC 0xc7b1dd30df4c8b88, 0x0a82e883a194f07b

/* حدّا منطقة الطلبات: الـbootloader يقبل ما بينهما فقط (base revision 3) */
#define LIMINE_REQUESTS_START_MARKER \
    { 0xf6b8f4b39de7d1ae, 0xfab91a6940fcb9cf, 0x785c6ed015d3e316, 0x181e920a7852b9d9 }
#define LIMINE_REQUESTS_END_MARKER \
    { 0xadc0e0531bb10d03, 0x9572709f31764c62 }

/* وسم الإصدار: الـbootloader يصفّر العنصر الثالث إن كان يدعم ما طلبناه */
#define LIMINE_BASE_REVISION(N) { 0xf9562b2d5c95a6c8, 0x6a7b384944536bdc, (N) }
#define LIMINE_BASE_REVISION_SUPPORTED(V) ((V)[2] == 0)

#define REQ_MARK  __attribute__((used, section(".limine_requests_start")))
#define REQ       __attribute__((used, section(".limine_requests")))
#define REQ_END   __attribute__((used, section(".limine_requests_end")))

/* ---- Higher Half Direct Map: إزاحةٌ تجعل كل فيزيائيٍّ مقروءاً بجمعها ---- */
struct limine_hhdm_response { uint64_t revision, offset; };
struct limine_hhdm_request {
    uint64_t id[4], revision;
    struct limine_hhdm_response *response;   /* يملؤه الـbootloader */
};
#define LIMINE_HHDM_REQUEST_ID \
    { LIMINE_COMMON_MAGIC, 0x48dcf1cb8ad2b852, 0x63984e959a98244b }

/* ---- خريطة الذاكرة الفيزيائية كما رآها الـfirmware ---- */
#define LIMINE_MEMMAP_USABLE                 0
#define LIMINE_MEMMAP_RESERVED               1
#define LIMINE_MEMMAP_ACPI_RECLAIMABLE       2
#define LIMINE_MEMMAP_ACPI_NVS               3
#define LIMINE_MEMMAP_BAD_MEMORY             4
#define LIMINE_MEMMAP_BOOTLOADER_RECLAIMABLE 5
#define LIMINE_MEMMAP_EXECUTABLE_AND_MODULES 6
#define LIMINE_MEMMAP_FRAMEBUFFER            7
#define LIMINE_MEMMAP_RESERVED_MAPPED        8

struct limine_memmap_entry { uint64_t base, length, type; };
struct limine_memmap_response {
    uint64_t revision, entry_count;
    struct limine_memmap_entry **entries;
};
struct limine_memmap_request {
    uint64_t id[4], revision;
    struct limine_memmap_response *response;
};
#define LIMINE_MEMMAP_REQUEST_ID \
    { LIMINE_COMMON_MAGIC, 0x67cf3d9d378a806f, 0xe304acdfc50c3c62 }

/* ---- عنوان صورة الكيرنل: الفيزيائيّ والافتراضيّ الذي حُمِّلت عليه ---- */
struct limine_executable_address_response {
    uint64_t revision, physical_base, virtual_base;
};
struct limine_executable_address_request {
    uint64_t id[4], revision;
    struct limine_executable_address_response *response;
};
#define LIMINE_EXECUTABLE_ADDRESS_REQUEST_ID \
    { LIMINE_COMMON_MAGIC, 0x71ba76863cc55f63, 0xb2644a48c516a487 }

/* ---- تعدّدُ المعالجات: الـbootloader يوقظ الباقي ويوقفها منتظِرة ---- */
struct limine_mp_info;
typedef void (*limine_goto_address)(struct limine_mp_info *);

struct limine_mp_info {
    uint32_t processor_id;
    uint32_t lapic_id;
    uint64_t reserved;                  /* للـbootloader: لا يُمَسّ */
    limine_goto_address goto_address;   /* كتابتُه release هي الإطلاق */
    uint64_t extra_argument;
};
struct limine_mp_response {
    uint64_t revision;
    uint32_t flags;
    uint32_t bsp_lapic_id;
    uint64_t cpu_count;                 /* يشمل المعالج الذي أقلع */
    struct limine_mp_info **cpus;
};
struct limine_mp_request {
    uint64_t id[4], revision;
    struct limine_mp_response *response;
    uint64_t flags;
};
#define LIMINE_MP_REQUEST_ID \
    { LIMINE_COMMON_MAGIC, 0x95a67b819a1b857e, 0xa0b61b723b6a73e0 }

#endif
