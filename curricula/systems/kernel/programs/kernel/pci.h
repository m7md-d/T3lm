#ifndef PCI_H
#define PCI_H
#include "kernel.h"
struct pci_dev {
    uint8_t  bus, slot, func;
    uint16_t vendor, device;
    uint8_t  class_, subclass, prog_if, header;
    uint32_t bar[6];
};
int  pci_scan(struct pci_dev *out, int max);
uint32_t pci_read32(uint8_t bus, uint8_t slot, uint8_t func, uint8_t off);
void pci_write32(uint8_t bus, uint8_t slot, uint8_t func, uint8_t off, uint32_t v);
const char *pci_class_name(uint8_t cls, uint8_t sub);
#endif
