#ifndef KERNEL_H
#define KERNEL_H
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#define PAGE_SIZE 4096ull

/* كل مرحلةٍ تعرّف هذه، وهي كل ما يفصل مرحلةً عن أخرى */
void stage_main(void);

/* ما يسلّمه الـbootloader — يُقرأ بعد boot_check() ولا يُفترض */
extern uint64_t hhdm_offset;                 /* فيزيائيّ + هذه = افتراضيّ مقروء */
extern uint64_t kernel_phys_base, kernel_virt_base;
extern struct limine_memmap_response *memmap;

static inline void *phys_to_virt(uint64_t p) { return (void *)(p + hhdm_offset); }

/* الإيقاف: لا يعود، ولا يترك المعالج ينفّذ ما بعده */
__attribute__((noreturn)) static inline void halt_forever(void) {
    for (;;) __asm__ volatile("cli; hlt");
}

static inline void outb(uint16_t port, uint8_t v)  { __asm__ volatile("outb %0,%1" :: "a"(v),  "Nd"(port)); }
static inline void outw(uint16_t port, uint16_t v) { __asm__ volatile("outw %0,%1" :: "a"(v),  "Nd"(port)); }
static inline void outl(uint16_t port, uint32_t v) { __asm__ volatile("outl %0,%1" :: "a"(v),  "Nd"(port)); }
static inline uint8_t  inb(uint16_t port) { uint8_t  v; __asm__ volatile("inb %1,%0" : "=a"(v) : "Nd"(port)); return v; }
static inline uint32_t inl(uint16_t port) { uint32_t v; __asm__ volatile("inl %1,%0" : "=a"(v) : "Nd"(port)); return v; }

/* منفذ QEMU الذي يُخرِج المحاكي بشفرةٍ معلومة — أداةُ فحصٍ لا جزءٌ من نواة */
static inline void qemu_exit(uint8_t code) { outl(0xf4, code); }

#endif
