type DoctorSeverity = 'ok' | 'info' | 'warn'

type DoctorFinding = {
  severity: DoctorSeverity
  code: string
  message: string
}

type DoctorArgs = {
  command: 'doctor'
  dir: string
}

type DoctorResult = {
  findings: DoctorFinding[]
  filesScanned: number
  exitCode: number
}

export type { DoctorArgs, DoctorFinding, DoctorResult, DoctorSeverity }
