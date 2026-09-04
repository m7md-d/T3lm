box a "المصدر" { type: source }
box f "المرشّح" { type: filter }
box s "المصبّ" { type: sink }
box m "المقياس" { type: meter }
link a.out -> f.in
link f.out -> s.in
