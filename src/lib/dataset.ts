import type { CaseData } from './gpaEngine'
import defaultDatasetJson from './defaultDataset.json'

export const DEFAULT_DATASET: CaseData = defaultDatasetJson as CaseData

export type CaseMeta = {
  case_id: string
  student_count: number
  classes: string[]
}
