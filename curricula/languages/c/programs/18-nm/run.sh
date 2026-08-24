make -s table.o
nm table.o | grep -v ltmp | grep -v '_chk' | grep -v 'l_\.str'
