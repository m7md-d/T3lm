/* هل يستطيع المترجم أن يفترض أنّ a وb لا يتداخلان؟ */
void add2(int *a, int *b) {
    *a += *b;
    *a += *b;
}

void add2r(int *restrict a, int *restrict b) {
    *a += *b;
    *a += *b;
}
