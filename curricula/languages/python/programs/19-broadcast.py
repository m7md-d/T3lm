import numpy as np

a = np.arange(3).reshape(3, 1)
b = np.arange(4).reshape(1, 4)
print(a + b)

x = np.arange(3)
big = np.broadcast_to(x, (4, 3))
print("\nالشكل:", big.shape, "| strides:", big.strides)
print("البايتات:", big.base.nbytes, "بدل", 4 * 3 * x.itemsize)

y = np.arange(4)
x + y
