#ifndef PIPE_H
#define PIPE_H
#include "kernel.h"
/* الأنبوب: حاجزٌ دائريّ، وطابورا نومٍ — واحدٌ للقرّاء وواحدٌ للكتّاب.
   ويجمع كلَّ ما سبق: وصفٌ (19) وحجبٌ ويقظة (20) وحالةٌ مشتركة (21). */
void pipe_create(const char *name, size_t cap);
uint64_t pipe_reader_blocks(void);
uint64_t pipe_writer_blocks(void);
#endif
