"""أصغرُ حلّالٍ يكفي — معادلاتٌ طبيعية وحذفٌ غاوسيّ، بلا مكتبة."""


def solve(matrix, rhs):
    """يحلّ Ax = b بالحذف الغاوسيّ مع محورٍ جزئيّ."""
    n = len(matrix)
    aug = [row[:] + [rhs[i]] for i, row in enumerate(matrix)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(aug[r][col]))
        aug[col], aug[pivot] = aug[pivot], aug[col]
        for row in range(col + 1, n):
            factor = aug[row][col] / aug[col][col]
            for k in range(col, n + 1):
                aug[row][k] -= factor * aug[col][k]
    out = [0.0] * n
    for row in reversed(range(n)):
        total = aug[row][n] - sum(aug[row][k] * out[k] for k in range(row + 1, n))
        out[row] = total / aug[row][row]
    return out


def least_squares(rows, unknowns):
    """rows: (معاملات، ثابت، وزن). يصغّر مجموعَ مربّعات البواقي الموزونة."""
    ata = [[0.0] * unknowns for _ in range(unknowns)]
    atb = [0.0] * unknowns
    for coeffs, target, weight in rows:
        for i in range(unknowns):
            for j in range(unknowns):
                ata[i][j] += weight * coeffs[i] * coeffs[j]
            atb[i] += weight * coeffs[i] * target
    return solve(ata, atb)
