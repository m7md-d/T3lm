/* PCI: فضاءُ إعدادٍ ثالث — لا ذاكرةٌ ولا منافذُ جهاز، بل نافذةٌ من منفذين.
   تكتب العنوان في 0xCF8 وتقرأ البيانات من 0xCFC. وكلُّ جهازٍ في النظام
   يُعرَف بثلاثة أرقام: ناقلٌ وفتحةٌ ووظيفة. */
#include "pci.h"
#include "log.h"

#define CFG_ADDR 0xCF8
#define CFG_DATA 0xCFC

static uint32_t addr_of(uint8_t bus, uint8_t slot, uint8_t func, uint8_t off) {
    return 0x80000000u                    /* بتُّ «تمكين» */
         | ((uint32_t)bus  << 16)
         | ((uint32_t)(slot & 0x1f) << 11)
         | ((uint32_t)(func & 7) << 8)
         | (off & 0xFC);                  /* المحاذاة إلى أربعة إلزامية */
}

uint32_t pci_read32(uint8_t bus, uint8_t slot, uint8_t func, uint8_t off) {
    outl(CFG_ADDR, addr_of(bus, slot, func, off));
    return inl(CFG_DATA);
}
void pci_write32(uint8_t bus, uint8_t slot, uint8_t func, uint8_t off, uint32_t v) {
    outl(CFG_ADDR, addr_of(bus, slot, func, off));
    outl(CFG_DATA, v);
}

const char *pci_class_name(uint8_t cls, uint8_t sub) {
    switch (cls) {
    case 0x00: return "unclassified";
    case 0x01: return sub == 0x01 ? "IDE controller" : "mass storage";
    case 0x02: return "network controller";
    case 0x03: return "display controller";
    case 0x04: return "multimedia";
    case 0x06: return sub == 0x00 ? "host bridge" : (sub == 0x01 ? "ISA bridge" : "bridge");
    case 0x0c: return "serial bus";
    default:   return "other";
    }
}

int pci_scan(struct pci_dev *out, int max) {
    int n = 0;
    for (uint16_t bus = 0; bus < 256 && n < max; bus++) {
        for (uint8_t slot = 0; slot < 32 && n < max; slot++) {
            uint32_t id = pci_read32((uint8_t)bus, slot, 0, 0x00);
            if ((id & 0xFFFF) == 0xFFFF) continue;        /* لا جهاز: الناقل يعيد آحاداً */
            uint8_t hdr = (uint8_t)(pci_read32((uint8_t)bus, slot, 0, 0x0C) >> 16);
            uint8_t funcs = (hdr & 0x80) ? 8 : 1;         /* جهازٌ متعدّد الوظائف */
            for (uint8_t f = 0; f < funcs && n < max; f++) {
                uint32_t fid = pci_read32((uint8_t)bus, slot, f, 0x00);
                if ((fid & 0xFFFF) == 0xFFFF) continue;
                uint32_t cls = pci_read32((uint8_t)bus, slot, f, 0x08);
                struct pci_dev *d = &out[n++];
                d->bus = (uint8_t)bus; d->slot = slot; d->func = f;
                d->vendor   = (uint16_t)(fid & 0xFFFF);
                d->device   = (uint16_t)(fid >> 16);
                d->prog_if  = (uint8_t)(cls >> 8);
                d->subclass = (uint8_t)(cls >> 16);
                d->class_   = (uint8_t)(cls >> 24);
                d->header   = (uint8_t)(pci_read32((uint8_t)bus, slot, f, 0x0C) >> 16) & 0x7f;
                for (int b = 0; b < 6; b++)
                    d->bar[b] = pci_read32((uint8_t)bus, slot, f, (uint8_t)(0x10 + 4 * b));
            }
        }
    }
    return n;
}
