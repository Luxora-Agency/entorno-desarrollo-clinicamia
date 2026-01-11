import { components, paths } from './api-generated.types'

// ==========================================
// Authentication & Session Types
// ==========================================

/**
 * Login response from backend
 */
export type ILoginResponse =
  paths['/auth/login']['post']['responses']['200']['content']['application/json']

/**
 * Refresh response from backend
 */
export type IRefreshResponse =
  paths['/auth/refresh']['post']['responses']['200']['content']['application/json']

/**
 * Session user data stored in encrypted cookie
 * Based on backend UserProfile schema
 */
export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

/**
 * Session data structure stored in HttpOnly encrypted cookie
 * Contains JWT tokens and user information
 */
export interface SessionData {
  accessToken: string
  refreshToken: string
  expiresAt: number // Unix timestamp en milisegundos
  user: SessionUser
}

/**
 * Response from /api/auth/token API route
 */
export interface TokenResponse {
  accessToken: string
  expiresAt: number
}

/**
 * Response from /api/auth/refresh API route
 */
export interface RefreshResponse {
  success: boolean
  accessToken: string
}

/**
 * Error responses from auth API routes
 */
export interface AuthApiError {
  error: string
  shouldRefresh?: boolean
}

// ==========================================
// User & Role Types
// ==========================================

export type IUser = Required<components['schemas']['UserListItem']>
export type IRole = Required<components['schemas']['Role']>
export type IPermission = components['schemas']['Permission']

// ==========================================
// Department & Specialty Types
// ==========================================

export type ISpecialty = components['schemas']['Specialty'] & {
  department?: components['schemas']['Department'] | null
}
export type IDepartment = components['schemas']['DepartmentWithManager']

// ==========================================
// Doctor Types
// ==========================================

export type IDoctor = components['schemas']['DoctorWithRelations']
export type IDoctorCreate =
  paths['/doctors']['post']['requestBody']['content']['application/json']
export type IDoctorUpdate =
  paths['/doctors/{id}']['put']['requestBody']['content']['application/json']

// ==========================================
// Patient Types
// ==========================================

export type IPatient = Required<components['schemas']['Patient']>

// ==========================================
// Exam & Procedure Types
// ==========================================

export type IExamProcedure = components['schemas']['ExamProcedure'] & {
  category?: components['schemas']['ExamProcedureCategory'] | null
}
export type IExamProcedureCategory =
  components['schemas']['ExamProcedureCategory']

export type IExamProcedureCreate =
  paths['/exam-procedures']['post']['requestBody']['content']['application/json']
export type IExamProcedureUpdate =
  paths['/exam-procedures/{id}']['put']['requestBody']['content']['application/json']

// ========================================== //
// Medical Order Types
// ========================================== //

export type IMedicalOrder = components['schemas']['MedicalOrder']
export type IMedicalOrderStatus = IMedicalOrder['status']
export type IMedicalOrderCreate =
  paths['/medical-orders']['post']['requestBody']['content']['application/json']
export type IMedicalOrderUpdate =
  paths['/medical-orders/{id}']['put']['requestBody']['content']['application/json']

// ========================================== //
// Product Types
// ========================================== //
export type IProduct = components['schemas']['Product']

// ========================================== //
// Product Tag Types
export type IProductTag = components['schemas']['ProductTag']
// ========================================== //

// ========================================== //
// Appointment Types
// ========================================== //
export type IAppointment = components['schemas']['Appointment']
export type IAppointmentCreate =
  paths['/appointments']['post']['requestBody']['content']['application/json']
export type IAppointmentUpdate =
  paths['/appointments/{id}']['put']['requestBody']['content']['application/json']

// Product Category Types
export type IProductCategory = components['schemas']['ProductCategory']
// ========================================== //

// ========================================== //
// Farmacia Order Types
export type IPharmacyOrder = components['schemas']['Order']
// ========================================== //

// ========================================== //
// Farmacia Order Item Types
// ========================================== //
//TODO: Esta creado asi por que no tengo forma de obtener el orderItem.
export type IPharmacyOrderItem = {
  productId: string
  quantity: number
  unitPrice: number
}
// ========================================== //

// ========================================== //
// Medical History Types
// ========================================== //

// ========================================== //
// Post Types
// ========================================== //
export type IPost = Required<components['schemas']['PostWithRelations']>
export type IPostCreate =
  paths['/posts']['post']['requestBody']['content']['application/json']
export type IPostUpdate =
  paths['/posts/{id}']['put']['requestBody']['content']['application/json']

// ========================================== //
// Post Category Types
// ========================================== //
export type IPostCategory = Required<
  components['schemas']['PostCategoryWithRelations']
>
export type IPostCategoryCreate =
  paths['/post-categories']['post']['requestBody']['content']['application/json']
export type IPostCategoryUpdate =
  paths['/post-categories/{id}']['put']['requestBody']['content']['application/json']
// ========================================== //
// Post Tag Types
// ========================================== //
export type IPostTag = components['schemas']['PostTagWithRelations']
export type IPostTagCreate =
  paths['/post-tags']['post']['requestBody']['content']['application/json']
export type IPostTagUpdate =
  paths['/post-tags/{id}']['put']['requestBody']['content']['application/json']

// ========================================== //
// Storage Types
// ========================================== //
export type IStorageSignatureResponse =
  paths['/storage/signature']['post']['responses']['200']['content']['application/json']['data']
export type IStorageSignatureResponsePublic =
  paths['/storage/signature/public']['post']['responses']['200']['content']['application/json']['data']
// ========================================== //
// Media Types
// ========================================== //
export type IMedia = components['schemas']['Media']
export type IMediaCreateResponse =
  paths['/media']['post']['responses']['201']['content']['application/json']['data']

// ========================================== //
// Medical History Types
// ========================================== //
export type IMedicalHistory = Required<components['schemas']['MedicalHistory']>
export type IMHEvolution = Required<components['schemas']['MhEvolution']>
export type IMHDiagnostic = Required<components['schemas']['MhDiagnostic']>

// ========================================== //
// Post Comment Types
// ========================================== //
export type IPostComment = Required<
  components['schemas']['PostCommentWithRelations']
>

// ========================================== //
// Newsletter Subscriber Types
// ========================================== //
export type INewLetterSubscriber = Required<
  components['schemas']['NewsletterSubscriberWithUser']
>
export type INewLetterEmail = Required<
  components['schemas']['NewsletterEmailWithCreator']
>
export type INewLetterEvent = Required<components['schemas']['NewsletterEvent']>

// ========================================== //
// Ticket Types
// ========================================== //
export type ITicket = Required<components['schemas']['TicketWithRelations']>
export type ITicketMessage = Required<
  components['schemas']['TicketMessageWithRelations']
>

// ========================================== //
// Medical Talent Types
// ========================================== //
export type ICandidate = Required<components['schemas']['Candidate']>
