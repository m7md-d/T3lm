"""«غير قابل للتمثيل» تعتمد على من يفحص — وحتى في C، الرفضُ علَمٌ تُشعِله."""
import pathlib
import subprocess

SRC = pathlib.Path(__file__).with_suffix(".c")


def compile_with(flags):
    run = subprocess.run(["cc", "-std=c17", "-fsyntax-only", *flags, str(SRC)],
                         capture_output=True, text=True)
    head = run.stderr.strip().split("\n")[0]
    return run.returncode, head.replace(str(SRC) + ":", "")


for flags, what in (([], "الافتراضيّ"), (["-Werror=incompatible-pointer-types"], "بالعلَم")):
    code, head = compile_with(flags)
    print(f"{what:<12} خروج={code}  {head}")
