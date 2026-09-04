/* المرساة — نفسُ الوصلة في C: الطرفُ مؤشّرٌ إلى صندوق، لا سلسلة. */
typedef struct { const char *name; } Box;
typedef struct { Box *src; Box *dst; } Link;

Link dangling(void) {
  Box a = {"a"};
  return (Link){.src = &a, .dst = "c"};   /* ← سلسلةٌ مكان الصندوق */
}
