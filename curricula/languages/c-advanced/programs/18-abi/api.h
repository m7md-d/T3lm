/* عقد الإضافة، الإصدار ٢ */
#define API_VERSION 2
struct api {
    int version;
    unsigned size;                 /* sizeof(struct api) كما رآه من بناها */
    int (*add)(int, int);
    int (*mul)(int, int);
};
