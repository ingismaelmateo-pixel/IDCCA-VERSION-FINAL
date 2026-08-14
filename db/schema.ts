import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  date,
  numeric,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums
export const memberStatusEnum = pgEnum("member_status", ["active", "inactive", "visitor"]);
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const maritalStatusEnum = pgEnum("marital_status", ["single", "married", "divorced", "widowed"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["tithe", "offering", "donation", "expense", "transfer"]);
export const eventTypeEnum = pgEnum("event_type", ["congress", "vigil", "campaign", "baptism", "conference", "retreat", "evangelism", "service", "other"]);
export const roleEnum = pgEnum("role", ["pastor_general", "pastor", "admin", "secretary", "treasurer", "leader", "teacher", "reception", "user"]);
export const prayerStatusEnum = pgEnum("prayer_status", ["pending", "in_progress", "answered", "closed"]);
export const counselingTypeEnum = pgEnum("counseling_type", ["matrimonial", "youth", "family", "spiritual"]);
export const itemCategoryEnum = pgEnum("item_category", ["instrument", "sound_equipment", "microphone", "projector", "computer", "furniture", "bible", "book", "vehicle", "other"]);

// Members table
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  photoUrl: text("photo_url"),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  gender: genderEnum("gender"),
  birthDate: date("birth_date"),
  maritalStatus: maritalStatusEnum("marital_status"),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  cellPhone: varchar("cell_phone", { length: 20 }),
  email: varchar("email", { length: 150 }),
  documentId: varchar("document_id", { length: 50 }),
  joinDate: date("join_date"),
  baptismDate: date("baptism_date"),
  conversionDate: date("conversion_date"),
  profession: varchar("profession", { length: 100 }),
  company: varchar("company", { length: 100 }),
  facebook: varchar("facebook", { length: 150 }),
  instagram: varchar("instagram", { length: 150 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  emergencyContact: varchar("emergency_contact", { length: 100 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  status: memberStatusEnum("status").default("active"),
  ministryId: integer("ministry_id"),
  leaderId: integer("leader_id"),
  smallGroupId: integer("small_group_id"),
  observations: text("observations"),
  privateNotes: text("private_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Family relationships
export const memberRelationships = pgTable("family_relationships", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id, { onDelete: "cascade" }),
  relatedMemberId: integer("related_member_id").references(() => members.id, { onDelete: "cascade" }),
  relationshipType: varchar("relationship_type", { length: 20 }).notNull(), 
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  unique: unique("unique_relationship").on(table.memberId, table.relatedMemberId, table.relationshipType),
}));

// Visitors table
export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  photoUrl: text("photo_url"),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  gender: genderEnum("gender"),
  birthDate: date("birth_date"),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  cellPhone: varchar("cell_phone", { length: 20 }),
  email: varchar("email", { length: 150 }),
  documentId: varchar("document_id", { length: 50 }),
  firstVisitDate: date("first_visit_date"),
  lastVisitDate: date("last_visit_date"),
  secondVisitDate: date("second_visit_date"),
  visitCount: integer("visit_count").default(1),
  invitedBy: integer("invited_by"),
  origin: varchar("origin", { length: 50 }),
  interests: text("interests"),
  decision: text("decision"),
  converted: boolean("converted").default(false),
  conversionDate: date("conversion_date"),
  baptismPending: boolean("baptism_pending").default(false),
  baptismDate: date("baptism_date"),
  followedBy: varchar("followed_by", { length: 150 }),
  followUpNotes: text("follow_up_notes"),
  observations: text("observations"),
  privateNotes: text("private_notes"),
  status: varchar("status", { length: 50 }).default("new"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ✅ Ministries table (YA ESTÁ)
export const ministries = pgTable("ministries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  leaderId: integer("leader_id").references(() => members.id, { onDelete: "set null" }),
  subLeaderId: integer("sub_leader_id").references(() => members.id, { onDelete: "set null" }),
  type: varchar("type", { length: 50 }),
  status: varchar("status", { length: 20 }).default('active'),
  meetingDay: varchar("meeting_day", { length: 20 }),
  meetingTime: varchar("meeting_time", { length: 20 }),
  meetingLocation: varchar("meeting_location", { length: 200 }),
  meetingFrequency: varchar("meeting_frequency", { length: 20 }).default('weekly'),
  objectives: text("objectives"),
  vision: text("vision"),
  goals: text("goals"),
  budget: numeric("budget", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  photoUrl: text("photo_url"),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ✅ Ministry members junction (MODIFICADO con foreign keys correctos)
export const ministryMembers = pgTable("ministry_members", {
  id: serial("id").primaryKey(),
  ministryId: integer("ministry_id")
    .references(() => ministries.id, { onDelete: "cascade" })
    .notNull(),
  memberId: integer("member_id")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  role: varchar("role", { length: 100 }),
  joinDate: date("join_date").default(sql`CURRENT_DATE`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ✅ AÑADIR RELACIONES (opcional pero recomendado)
// Nota: Estas relaciones son para usar con Drizzle, no afectan la base de datos
// Si usas Drizzle Relations, descomenta esto:
/*
import { relations } from "drizzle-orm";

export const ministriesRelations = relations(ministries, ({ one, many }) => ({
  leader: one(members, {
    fields: [ministries.leaderId],
    references: [members.id],
  }),
  subLeader: one(members, {
    fields: [ministries.subLeaderId],
    references: [members.id],
  }),
  members: many(ministryMembers),
}));

export const ministryMembersRelations = relations(ministryMembers, ({ one }) => ({
  ministry: one(ministries, {
    fields: [ministryMembers.ministryId],
    references: [ministries.id],
  }),
  member: one(members, {
    fields: [ministryMembers.memberId],
    references: [members.id],
  }),
}));
*/

// ... RESTA DEL CÓDIGO (bibleCourses, courseEnrollments, etc.)

// Bible courses
export const bibleCourses = pgTable("bible_courses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  level: varchar("level", { length: 20 }),
  teacherId: integer("teacher_id").references(() => members.id),
  scheduleDay: varchar("schedule_day", { length: 20 }),
  scheduleTime: varchar("schedule_time", { length: 20 }),
  duration: varchar("duration", { length: 50 }),
  maxStudents: integer("max_students").default(30),
  currentStudents: integer("current_students").default(0),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: varchar("status", { length: 20 }).default('active'),
  requirements: text("requirements"),
  syllabus: text("syllabus"),
  photoUrl: text("photo_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course enrollments
export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => bibleCourses.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => members.id, { onDelete: "cascade" }),
  enrollmentDate: date("enrollment_date").default(sql`CURRENT_DATE`),
  status: varchar("status", { length: 20 }).default('active'),
  attendance: integer("attendance").default(0),
  totalClasses: integer("total_classes").default(0),
  completionCertificate: boolean("completion_certificate").default(false),
  certificateDate: date("certificate_date"),
  certificateUrl: text("certificate_url"),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Class attendance
export const classAttendance = pgTable("class_attendance", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => courseEnrollments.id, { onDelete: "cascade" }),
  classDate: date("class_date").notNull(),
  present: boolean("present").default(false),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course lessons
export const courseLessons = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => bibleCourses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  bibleVerses: text("bible_verses"),
  order: integer("order").default(0),
  date: date("date"),
  teacherId: integer("teacher_id").references(() => members.id),
  materialUrl: text("material_url"),
  videoUrl: text("video_url"),
  duration: integer("duration"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Small groups
export const smallGroups = pgTable("small_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  leaderId: integer("leader_id"),
  ministryId: integer("ministry_id"),
  meetingDay: varchar("meeting_day", { length: 20 }),
  meetingTime: varchar("meeting_time", { length: 20 }),
  meetingAddress: text("meeting_address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  eventType: eventTypeEnum("event_type").default("service"),
  bannerUrl: text("banner_url"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  capacity: integer("capacity"),
  registeredCount: integer("registered_count").default(0),
  hasQrCode: boolean("has_qr_code").default(false),
  qrCodeUrl: text("qr_code_url"),
  ministryId: integer("ministry_id"),
  organizerId: integer("organizer_id"),
  isPublic: boolean("is_public").default(true),
  status: varchar("status", { length: 50 }).default("upcoming"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id"),
  visitorId: integer("visitor_id"),
  eventId: integer("event_id"),
  personType: varchar("person_type", { length: 20 }).notNull().default("member"),
  ministryId: integer("ministry_id"),
  attendanceDate: date("attendance_date").notNull(),
  serviceType: varchar("service_type", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("present"),
  isPresent: boolean("is_present").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tithes = pgTable("tithes", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id"),
  memberName: varchar("member_name", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("Efectivo"),
  date: varchar("date", { length: 50 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial transactions
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  memberId: integer("member_id"),
  ministryId: integer("ministry_id"),
  eventId: integer("event_id"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  receiptNumber: varchar("receipt_number", { length: 50 }),
  transactionDate: date("transaction_date").notNull(),
  notes: text("notes"),
  recordedBy: integer("recorded_by"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Budgets
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  ministryId: integer("ministry_id"),
  eventId: integer("event_id"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  usedAmount: numeric("used_amount", { precision: 12, scale: 2 }).default("0"),
  year: integer("year").notNull(),
  month: integer("month"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bible classes
export const bibleClasses = pgTable("bible_classes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  teacherId: integer("teacher_id"),
  level: varchar("level", { length: 50 }),
  schedule: text("schedule"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  materialsUrl: text("materials_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bible class enrollments
export const classEnrollments = pgTable("class_enrollments", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  memberId: integer("member_id").notNull(),
  enrollmentDate: date("enrollment_date"),
  grade: numeric("grade", { precision: 5, scale: 2 }),
  completionDate: date("completion_date"),
  certificateIssued: boolean("certificate_issued").default(false),
  status: varchar("status", { length: 50 }).default("enrolled"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory items
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  category: itemCategoryEnum("category").notNull(),
  description: text("description"),
  serialNumber: varchar("serial_number", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  quantity: integer("quantity").default(1),
  location: varchar("location", { length: 150 }),
  responsibleId: integer("responsible_id"),
  purchaseDate: date("purchase_date", { mode: "date" }),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
  condition: varchar("condition", { length: 50 }).default("good"),
  qrCodeUrl: text("qr_code_url"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Library books
export const libraryBooks = pgTable("library_books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  author: varchar("author", { length: 150 }),
  isbn: varchar("isbn", { length: 20 }),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  quantity: integer("quantity").default(1),
  availableCount: integer("available_count").default(1),
  publishedYear: integer("published_year"),
  coverUrl: text("cover_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Book loans
export const bookLoans = pgTable("book_loans", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  memberId: integer("member_id").notNull(),
  loanDate: date("loan_date").notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  status: varchar("status", { length: 50 }).default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prayer requests
export const prayerRequests = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id"),
  requesterName: varchar("requester_name", { length: 150 }),
  request: text("request").notNull(),
  category: varchar("category", { length: 100 }),
  status: prayerStatusEnum("status").default("pending"),
  responsibleId: integer("responsible_id"),
  response: text("response"),
  testimony: text("testimony"),
  isPrivate: boolean("is_private").default(false),
  requestDate: date("request_date").notNull(),
  answeredDate: date("answered_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Counseling sessions
export const counselingSessions = pgTable("counseling_sessions", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id"),
  counselorId: integer("counselor_id"),
  type: counselingTypeEnum("type").notNull(),
  sessionDate: timestamp("session_date").notNull(),
  duration: integer("duration"),
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  status: varchar("status", { length: 50 }).default("scheduled"),
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sermons
export const sermons = pgTable("sermons", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  preacherId: integer("preacher_id"),
  series: varchar("series", { length: 150 }),
  sermonDate: date("sermon_date").notNull(),
  audioUrl: text("audio_url"),
  videoUrl: text("video_url"),
  pdfUrl: text("pdf_url"),
  presentationUrl: text("presentation_url"),
  bibleReference: varchar("bible_reference", { length: 150 }),
  tags: text("tags"),
  description: text("description"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pastoral visits
export const pastoralVisits = pgTable("pastoral_visits", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id, { onDelete: "cascade" }),
  pastorId: integer("pastor_id").references(() => members.id),
  visitType: varchar("visit_type", { length: 100 }),
  visitDate: timestamp("visit_date").notNull(),
  duration: integer("duration"),
  notes: text("notes"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  status: varchar("status", { length: 50 }).default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users / Staff
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id"),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  passwordHash: text("password_hash"),
  role: roleEnum("role").default("user"),
  isActive: boolean("is_active").default(true),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit log
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: varchar("action", { length: 100 }).notNull(),
  tableName: varchar("table_name", { length: 100 }),
  recordId: integer("record_id"),
  oldValues: text("old_values"),
  newValues: text("new_values"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id"),
  targetAudience: varchar("target_audience", { length: 100 }).default("all"),
  publishDate: timestamp("publish_date"),
  expiryDate: timestamp("expiry_date"),
  isPinned: boolean("is_pinned").default(false),
  isPublished: boolean("is_published").default(false),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cash register
export const cashRegister = pgTable("cash_register", {
  id: serial("id").primaryKey(),
  openingDate: timestamp("opening_date").notNull(),
  closingDate: timestamp("closing_date"),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }).notNull(),
  closingBalance: numeric("closing_balance", { precision: 12, scale: 2 }),
  totalIncome: numeric("total_income", { precision: 12, scale: 2 }).default("0"),
  totalExpenses: numeric("total_expenses", { precision: 12, scale: 2 }).default("0"),
  cashierId: integer("cashier_id"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).default("open"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sunday School Students
export const sundaySchoolStudents = pgTable("sunday_school_students", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  birthDate: date("birth_date").notNull(),
  photoUrl: text("photo_url"),
  parentId: integer("parent_id").references(() => members.id, { onDelete: "set null" }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  grade: varchar("grade", { length: 50 }),
  allergies: text("allergies"),
  emergencyContact: varchar("emergency_contact", { length: 100 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }),
  fileSize: integer("file_size"),
  authorId: integer("author_id").references(() => members.id, { onDelete: "set null" }),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sunday School Attendance
export const sundaySchoolAttendance = pgTable("sunday_school_attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => sundaySchoolStudents.id, { onDelete: "cascade" }),
  attendanceDate: date("attendance_date").notNull(),
  isPresent: boolean("is_present").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
 updatedAt: timestamp("updated_at").defaultNow(), // ✅ Agregar esta línea
});