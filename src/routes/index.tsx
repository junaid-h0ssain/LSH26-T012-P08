import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { evaluateCase, type CaseData } from '../lib/gpaEngine'
import { DEFAULT_DATASET } from '../lib/dataset'
import {
  GraduationCap,
  FileCheck,
  AlertTriangle,
  Upload,
  RotateCcw,
  Search,
  CheckCircle2,
  BookOpen,
  BarChart3,
  User,
  Award,
  ChevronRight,
  Printer,
  Users,
  TrendingUp,
  ShieldAlert,
  FlaskConical,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'

export const Route = createFileRoute('/')({ component: SchoolGpaDashboard })

function gradeBadgeVariant(grade: string) {
  if (grade === 'A+') return 'default' as const
  if (grade === 'A' || grade === 'A-') return 'secondary' as const
  if (grade === 'F') return 'destructive' as const
  return 'outline' as const
}

function SchoolGpaDashboard() {
  const [caseData, setCaseData] = useState<CaseData>(DEFAULT_DATASET)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState<string>('ALL')
  const [gradeFilter, setGradeFilter] = useState<string>('ALL')
  const [activeTab, setActiveTab] = useState('results')
  const [checkingListTab, setCheckingListTab] = useState('all')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const results = useMemo(() => evaluateCase(caseData), [caseData])

  const classes = useMemo(() => {
    const set = new Set<string>()
    for (const r of results) if (r.class) set.add(r.class)
    return Array.from(set).sort()
  }, [results])

  const hardEdges = useMemo(() => ({
    highAvgFail: results.filter((r) => r.flags.highAvgFail),
    practicalFail: results.filter((r) => r.flags.practicalFail),
    optBelowPoint: results.filter((r) => r.flags.optionalRuleAffected),
    absent: results.filter((r) => r.flags.absent),
  }), [results])

  const checkingLists = useMemo(() => {
    const optList = results.filter((r) => r.flags.optionalRuleAffected)
    const practList = results.filter((r) => r.flags.practicalFail)
    const absList = results.filter((r) => r.flags.absent)
    const allFlagged = results.filter((r) => r.flags.optionalRuleAffected || r.flags.practicalFail || r.flags.absent)
    return { optList, practList, absList, allFlagged }
  }, [results])

  const filteredResults = useMemo(() => results.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = classFilter === 'ALL' || r.class === classFilter
    const matchesGrade = gradeFilter === 'ALL' || (gradeFilter === 'PASS' && !r.hasCompulsoryFail) || (gradeFilter === 'FAIL' && r.hasCompulsoryFail) || r.finalGrade === gradeFilter
    return matchesSearch && matchesClass && matchesGrade
  }), [results, searchQuery, classFilter, gradeFilter])

  const activeStudentResult = useMemo(() => {
    if (selectedStudentId) return results.find((r) => r.id === selectedStudentId) || results[0]
    return results[0]
  }, [results, selectedStudentId])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)
        let targetCase: CaseData | null = null
        if (parsed.cases && Array.isArray(parsed.cases) && parsed.cases.length > 0) targetCase = parsed.cases[0]
        else if (parsed.students && parsed.compulsory && parsed.subjects) targetCase = parsed as CaseData
        if (!targetCase || !targetCase.students || !targetCase.compulsory) throw new Error('Invalid JSON schema format.')
        setCaseData(targetCase)
        setSelectedStudentId(targetCase.students[0]?.id || null)
      } catch (err: any) {
        setUploadError(`Failed to load JSON fixture: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  const handleResetToDefault = () => {
    setCaseData(DEFAULT_DATASET)
    setSelectedStudentId(DEFAULT_DATASET.students[0]?.id || null)
    setUploadError(null)
  }

  const stats = useMemo(() => {
    const total = results.length
    const passed = results.filter((r) => !r.hasCompulsoryFail).length
    const failed = total - passed
    const gpa5 = results.filter((r) => r.finalGpa === 5.0 && !r.hasCompulsoryFail).length
    const avgGpa = total > 0 ? (results.reduce((sum, r) => sum + r.finalGpa, 0) / total).toFixed(2) : '0.00'
    return { total, passed, failed, gpa5, avgGpa }
  }, [results])

  const checkingDisplay = checkingListTab === 'all' ? checkingLists.allFlagged : checkingListTab === 'optional' ? checkingLists.optList : checkingListTab === 'practical' ? checkingLists.practList : checkingLists.absList

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold tracking-tight">GPA & Result Processing Engine</h1>
                <Badge variant="secondary" className="font-mono text-[11px]">{caseData.case_id || 'ACTIVE CASE'}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">LSH26-T012 · P08 · 6 compulsory + 1 optional · Theory 75 / Practical 25</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="size-3.5" /> Upload JSON
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetToDefault}><RotateCcw className="size-3.5" /> Reset</Button>
            <Button size="sm" onClick={() => window.print()}><Printer className="size-3.5" /> Print</Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {uploadError && (
          <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertTitle>Upload failed</AlertTitle><AlertDescription>{uploadError}</AlertDescription></Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card size="sm">
            <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5"><Users className="size-3.5" /> Total Students</CardDescription><CardTitle className="text-2xl">{stats.total}</CardTitle></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{classes.join(' · ')} · 7 subjects each</p></CardContent>
          </Card>
          <Card size="sm">
            <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-3.5" /> Passed</CardDescription><CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">{stats.passed}</CardTitle></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{stats.total ? Math.round((stats.passed / stats.total) * 100) : 0}% pass rate</p></CardContent>
          </Card>
          <Card size="sm">
            <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5 text-destructive"><ShieldAlert className="size-3.5" /> Failed</CardDescription><CardTitle className="text-2xl text-destructive">{stats.failed}</CardTitle></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{stats.total ? Math.round((stats.failed / stats.total) * 100) : 0}% · GPA 0.00</p></CardContent>
          </Card>
          <Card size="sm">
            <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5"><Award className="size-3.5" /> A+</CardDescription><CardTitle className="text-2xl">{stats.gpa5}</CardTitle></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">GPA 5.00 · capped</p></CardContent>
          </Card>
          <Card size="sm" className="col-span-2 lg:col-span-1 border-amber-200 dark:border-amber-900/50">
            <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5"><FileCheck className="size-3.5" /> Needs Verification</CardDescription><CardTitle className="text-2xl">{checkingLists.allFlagged.length}</CardTitle></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">Office checking list</p></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="line" className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="results"><BarChart3 className="size-4" /> Results & GPA <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[11px]">{results.length}</Badge></TabsTrigger>
            <TabsTrigger value="trace"><BookOpen className="size-4" /> Trace {activeStudentResult && <span className="font-mono text-[11px]">{activeStudentResult.id}</span>}</TabsTrigger>
            <TabsTrigger value="checking"><FileCheck className="size-4" /> Checking Lists <Badge variant="secondary" className="ml-1 h-5 px-1.5">{checkingLists.allFlagged.length}</Badge></TabsTrigger>
            <TabsTrigger value="hardedges"><AlertTriangle className="size-4" /> Hard Edges</TabsTrigger>
          </TabsList>

          {/* RESULTS */}
          <TabsContent value="results" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input placeholder="Search by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                  </div>
                  <div className="flex gap-2">
                    <Select value={classFilter} onValueChange={setClassFilter}>
                      <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{['ALL', ...classes].map(c => <SelectItem key={c} value={c}>{c === 'ALL' ? 'All Classes' : c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={gradeFilter} onValueChange={setGradeFilter}>
                      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Grades</SelectItem>
                        <SelectItem value="PASS">Passing only</SelectItem>
                        <SelectItem value="FAIL">Failing only</SelectItem>
                        <SelectItem value="A+">A+ (5.00)</SelectItem>
                        <SelectItem value="A">A (4.00-4.99)</SelectItem>
                        <SelectItem value="A-">A- (3.50-3.99)</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden py-0 gap-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Compulsory Sum</TableHead>
                    <TableHead>Optional</TableHead>
                    <TableHead>Avg (uncancelled)</TableHead>
                    <TableHead>Final GPA</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Trace</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No students match your filters.</TableCell></TableRow>
                  ) : filteredResults.map((r) => (
                    <TableRow key={r.id} data-state={selectedStudentId === r.id ? 'selected' : undefined} className="cursor-pointer" onClick={() => { setSelectedStudentId(r.id); setActiveTab('trace') }}>
                      <TableCell className="font-mono font-medium">{r.id}</TableCell>
                      <TableCell><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.class}</div></TableCell>
                      <TableCell className="font-mono text-xs">{r.sumCompulsoryPoints.toFixed(2)}<span className="text-muted-foreground"> / 30</span></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-medium">{r.optionalCode}</span>
                          <Badge variant="outline" className="font-mono text-[11px]">GP {r.optionalGradePoint.toFixed(1)}</Badge>
                          <Badge variant={r.optionalContribution > 0 ? 'secondary' : 'outline'} className="font-mono text-[11px]">+{r.optionalContribution.toFixed(2)}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <span className={r.hasCompulsoryFail && r.uncancelledGpa >= 3 ? 'line-through text-muted-foreground' : ''}>{r.uncancelledGpa.toFixed(2)}</span>
                        {r.hasCompulsoryFail && <Badge variant="destructive" className="ml-1.5 text-[10px] h-4">cancelled</Badge>}
                      </TableCell>
                      <TableCell className="font-mono font-semibold">{r.finalGpa.toFixed(2)}</TableCell>
                      <TableCell><Badge variant={gradeBadgeVariant(r.finalGrade)}>{r.finalGrade}</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); setSelectedStudentId(r.id); setActiveTab('trace') }}>Trace <ChevronRight className="size-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TRACE */}
          <TabsContent value="trace" className="space-y-4 mt-4">
            {activeStudentResult && (
              <>
                <Card>
                  <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-muted"><User className="size-5" /></div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{activeStudentResult.name}</span>
                          <Badge variant="outline" className="font-mono">{activeStudentResult.id}</Badge>
                          <Badge variant="secondary">{activeStudentResult.class}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Optional: {activeStudentResult.optionalCode} · {activeStudentResult.optionalName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:inline">Switch:</span>
                      <Select value={activeStudentResult.id} onValueChange={setSelectedStudentId}>
                        <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {results.map(s => <SelectItem key={s.id} value={s.id}>{s.id} — {s.name} ({s.finalGrade})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {activeStudentResult.hasCompulsoryFail && (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertTitle>Compulsory failure → Final GPA 0.00 (F)</AlertTitle>
                    <AlertDescription>
                      Rule R-13: any compulsory failure cancels the GPA. Uncancelled average was <span className="font-mono font-semibold">{activeStudentResult.uncancelledGpa.toFixed(2)}</span>.
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {activeStudentResult.failedCompulsorySubjects.map(f => (
                          <Badge key={f.code} variant="destructive" className="font-mono text-[11px]">{f.name} ({f.code}): {f.reason}</Badge>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Card className="overflow-hidden py-0 gap-0">
                  <CardHeader className="bg-muted/30 border-b py-4">
                    <div className="flex items-center justify-between">
                      <div><CardTitle className="text-sm">Subject Evaluation Trace</CardTitle><CardDescription>Mark used, grade point and governing rule per subject</CardDescription></div>
                      <Badge variant="outline">7 subjects</Badge>
                    </div>
                  </CardHeader>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Subject</TableHead><TableHead>Type</TableHead><TableHead>Marks</TableHead><TableHead>Total</TableHead><TableHead>GP</TableHead><TableHead>Grade</TableHead><TableHead>Rule</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeStudentResult.subjectTraces.map(t => (
                        <TableRow key={t.code} className={!t.passed ? 'bg-destructive/5' : ''}>
                          <TableCell><div className="font-medium text-xs">{t.name}</div><div className="font-mono text-[11px] text-muted-foreground">{t.code}</div></TableCell>
                          <TableCell><Badge variant={t.isCompulsory ? 'outline' : 'secondary'} className="text-[11px]">{t.isCompulsory ? 'Compulsory' : 'Optional'}</Badge></TableCell>
                          <TableCell className="font-mono text-xs">
                            {t.practical ? t.rawMark === 'AB' ? <span className="text-destructive font-semibold">AB</span> : <span><span className={t.theoryMark! < 25 ? 'text-destructive font-bold' : ''}>Th {t.theoryMark}/75</span> · <span className={t.practicalMark! < 8 ? 'text-destructive font-bold' : ''}>Pr {t.practicalMark}/25</span></span>
                              : <span>{t.totalMark === 'AB' ? <span className="text-destructive font-bold">AB</span> : `${t.totalMark}/100`}</span>}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{t.totalMark === 'AB' ? <span className="text-destructive font-bold">AB</span> : <span className={!t.passed ? 'text-destructive font-bold' : ''}>{String(t.totalMark)}</span>}</TableCell>
                          <TableCell className="font-mono font-semibold text-xs">{t.gradePoint.toFixed(2)}</TableCell>
                          <TableCell><Badge variant={t.letterGrade === 'F' ? 'destructive' : 'outline'} className="text-[11px]">{t.letterGrade}</Badge></TableCell>
                          <TableCell className="max-w-[360px] whitespace-normal text-xs text-muted-foreground leading-relaxed">{t.ruleApplied}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Award className="size-4" /> GPA Resolution (R-13)</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-xl border bg-muted/30 p-3 space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">1 · Sum of 6 compulsory GP</p>
                        <p className="font-mono text-sm font-semibold">{activeStudentResult.compulsoryGradePoints.map(c => c.point.toFixed(1)).join(' + ')} = {activeStudentResult.sumCompulsoryPoints.toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3 space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">2 · Optional bonus</p>
                        <p className="font-mono text-sm font-semibold">max(0, {activeStudentResult.optionalGradePoint.toFixed(1)} − 2) = +{activeStudentResult.optionalContribution.toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3 space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">3 · Final</p>
                        <p className="font-mono text-sm font-semibold">min(5.00, ({activeStudentResult.sumCompulsoryPoints.toFixed(2)} + {activeStudentResult.optionalContribution.toFixed(2)}) / 6) = {activeStudentResult.uncancelledGpa.toFixed(2)}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Final:</span>
                        <span className="font-mono font-bold">GPA {activeStudentResult.finalGpa.toFixed(2)}</span>
                        <Badge variant={activeStudentResult.finalGrade === 'F' ? 'destructive' : 'default'}>{activeStudentResult.finalGrade}</Badge>
                      </div>
                      {activeStudentResult.hasCompulsoryFail ? <span className="text-xs text-destructive font-medium">Compulsory fail overridden to 0.00</span> : <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="size-3.5" /> All compulsory passed</span>}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* CHECKING */}
          <TabsContent value="checking" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileCheck className="size-5" /> Office Pre-Publication Checking List <Badge variant="secondary">{checkingLists.allFlagged.length} flagged</Badge></CardTitle>
                <CardDescription>R-29 · Hand-verify before publishing results</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={checkingListTab} onValueChange={setCheckingListTab}>
                  <TabsList>
                    <TabsTrigger value="all">All ({checkingLists.allFlagged.length})</TabsTrigger>
                    <TabsTrigger value="optional">Optional ≤2.0 ({checkingLists.optList.length})</TabsTrigger>
                    <TabsTrigger value="practical">Practical fail ({checkingLists.practList.length})</TabsTrigger>
                    <TabsTrigger value="absent">Absent ({checkingLists.absList.length})</TabsTrigger>
                  </TabsList>
                  <div className="mt-4 rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50"><TableHead>ID</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Flags</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {checkingDisplay.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono font-medium">{r.id}</TableCell>
                            <TableCell className="font-medium">{r.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.class}</TableCell>
                            <TableCell><div className="flex flex-wrap gap-1">
                              {r.flags.optionalRuleAffected && <Badge variant="outline" className="text-[11px]">Optional GP {r.optionalGradePoint.toFixed(1)} ≤ 2.0</Badge>}
                              {r.flags.practicalFail && <Badge variant="destructive" className="text-[11px]">Practical &lt; 8</Badge>}
                              {r.flags.absent && <Badge variant="secondary" className="text-[11px]">AB</Badge>}
                            </div></TableCell>
                            <TableCell><Badge variant={r.finalGrade === 'F' ? 'destructive' : 'secondary'}>{r.finalGrade} · {r.finalGpa.toFixed(2)}</Badge></TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="xs" onClick={() => { setSelectedStudentId(r.id); setActiveTab('trace') }}>Trace <ChevronRight className="size-3" /></Button></TableCell>
                          </TableRow>
                        ))}
                        {checkingDisplay.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No students in this list.</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HARD EDGES */}
          <TabsContent value="hardedges" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-600" /> Hard Edge & Corner Case Verification</CardTitle><CardDescription>Requirement 1 · At least 8 students across 4 categories</CardDescription></CardHeader>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="size-4 text-destructive" /> High average, still failed</CardTitle><Badge variant="destructive">{hardEdges.highAvgFail.length}</Badge></div><CardDescription>Uncancelled ≥ 3.00 but one compulsory fail → 0.00 (F)</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  {hardEdges.highAvgFail.map(s => (
                    <button key={s.id} onClick={() => { setSelectedStudentId(s.id); setActiveTab('trace') }} className="w-full flex items-center justify-between rounded-xl border p-3 text-left hover:bg-muted/50 transition">
                      <div><span className="font-mono text-xs font-bold">{s.id}</span><span className="ml-2 text-sm font-medium">{s.name}</span><div className="text-[11px] text-muted-foreground">Failed: {s.failedCompulsorySubjects.map(f => f.code).join(', ')}</div></div>
                      <div className="text-right font-mono text-xs"><div className="line-through text-muted-foreground">{s.uncancelledGpa.toFixed(2)}</div><div className="font-bold text-destructive">0.00 F</div></div>
                    </button>
                  ))}
                  {hardEdges.highAvgFail.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">None</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="size-4 text-amber-600" /> Practical fail, theory passed</CardTitle><Badge variant="outline">{hardEdges.practicalFail.length}</Badge></div><CardDescription>Th ≥ 25 but Pr &lt; 8 → GP 0.0 (R-11)</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  {hardEdges.practicalFail.slice(0, 6).map(s => (
                    <button key={s.id} onClick={() => { setSelectedStudentId(s.id); setActiveTab('trace') }} className="w-full flex items-center justify-between rounded-xl border p-3 text-left hover:bg-muted/50 transition">
                      <div><span className="font-mono text-xs font-bold">{s.id}</span><span className="ml-2 text-sm font-medium">{s.name}</span></div>
                      <Badge variant="outline" className="text-[11px]">Pr &lt; 8</Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm">Optional ≤ 2.0 (no bonus)</CardTitle><Badge variant="secondary">{hardEdges.optBelowPoint.length}</Badge></div><CardDescription>GP ≤ 2.0 contributes +0.00 (R-13)</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  {hardEdges.optBelowPoint.slice(0, 6).map(s => (
                    <button key={s.id} onClick={() => { setSelectedStudentId(s.id); setActiveTab('trace') }} className="w-full flex items-center justify-between rounded-xl border p-3 text-left hover:bg-muted/50 transition">
                      <div><span className="font-mono text-xs font-bold">{s.id}</span><span className="ml-2 text-sm">{s.name}</span><span className="text-muted-foreground text-xs ml-1">({s.optionalCode})</span></div>
                      <Badge variant="outline" className="font-mono text-[11px]">GP {s.optionalGradePoint.toFixed(1)}</Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm flex items-center gap-2"><User className="size-4" /> Absent (AB)</CardTitle><Badge variant="outline">{hardEdges.absent.length}</Badge></div><CardDescription>R-12 · Compulsory AB → F; Optional AB → 0 contribution</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  {hardEdges.absent.map(s => (
                    <button key={s.id} onClick={() => { setSelectedStudentId(s.id); setActiveTab('trace') }} className="w-full flex items-center justify-between rounded-xl border p-3 text-left hover:bg-muted/50 transition">
                      <div><span className="font-mono text-xs font-bold">{s.id}</span><span className="ml-2 text-sm font-medium">{s.name}</span></div>
                      <Badge variant="secondary" className="font-mono text-[11px]">AB</Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
