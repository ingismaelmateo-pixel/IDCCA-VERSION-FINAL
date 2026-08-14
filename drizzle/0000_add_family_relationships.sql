CREATE TYPE "public"."counseling_type" AS ENUM('matrimonial', 'youth', 'family', 'spiritual');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('congress', 'vigil', 'campaign', 'baptism', 'conference', 'retreat', 'evangelism', 'service', 'other');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."item_category" AS ENUM('instrument', 'sound_equipment', 'microphone', 'projector', 'computer', 'furniture', 'bible', 'book', 'vehicle', 'other');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('single', 'married', 'divorced', 'widowed');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'inactive', 'visitor');--> statement-breakpoint
CREATE TYPE "public"."prayer_status" AS ENUM('pending', 'in_progress', 'answered', 'closed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('pastor_general', 'pastor', 'admin', 'secretary', 'treasurer', 'leader', 'teacher', 'reception', 'user');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('tithe', 'offering', 'donation', 'expense', 'transfer');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"author_id" integer,
	"target_audience" varchar(100) DEFAULT 'all',
	"publish_date" timestamp,
	"expiry_date" timestamp,
	"is_pinned" boolean DEFAULT false,
	"is_published" boolean DEFAULT false,
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer,
	"event_id" integer,
	"ministry_id" integer,
	"attendance_date" date NOT NULL,
	"service_type" varchar(50),
	"is_present" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" varchar(100) NOT NULL,
	"table_name" varchar(100),
	"record_id" integer,
	"old_values" text,
	"new_values" text,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bible_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"teacher_id" integer,
	"level" varchar(50),
	"schedule" text,
	"start_date" date,
	"end_date" date,
	"materials_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bible_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(50),
	"level" varchar(20),
	"teacher_id" integer,
	"schedule_day" varchar(20),
	"schedule_time" varchar(20),
	"duration" varchar(50),
	"max_students" integer DEFAULT 30,
	"current_students" integer DEFAULT 0,
	"start_date" date,
	"end_date" date,
	"status" varchar(20) DEFAULT 'active',
	"requirements" text,
	"syllabus" text,
	"photo_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "book_loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"loan_date" date NOT NULL,
	"due_date" date NOT NULL,
	"return_date" date,
	"status" varchar(50) DEFAULT 'active',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"ministry_id" integer,
	"event_id" integer,
	"total_amount" numeric(12, 2) NOT NULL,
	"used_amount" numeric(12, 2) DEFAULT '0',
	"year" integer NOT NULL,
	"month" integer,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cash_register" (
	"id" serial PRIMARY KEY NOT NULL,
	"opening_date" timestamp NOT NULL,
	"closing_date" timestamp,
	"opening_balance" numeric(12, 2) NOT NULL,
	"closing_balance" numeric(12, 2),
	"total_income" numeric(12, 2) DEFAULT '0',
	"total_expenses" numeric(12, 2) DEFAULT '0',
	"cashier_id" integer,
	"notes" text,
	"status" varchar(50) DEFAULT 'open',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "class_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer,
	"class_date" date NOT NULL,
	"present" boolean DEFAULT false,
	"observations" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "class_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"enrollment_date" date,
	"grade" numeric(5, 2),
	"completion_date" date,
	"certificate_issued" boolean DEFAULT false,
	"status" varchar(50) DEFAULT 'enrolled',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "counseling_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer,
	"counselor_id" integer,
	"type" "counseling_type" NOT NULL,
	"session_date" timestamp NOT NULL,
	"duration" integer,
	"notes" text,
	"follow_up_date" timestamp,
	"status" varchar(50) DEFAULT 'scheduled',
	"is_private" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"student_id" integer,
	"enrollment_date" date DEFAULT CURRENT_DATE,
	"status" varchar(20) DEFAULT 'active',
	"attendance" integer DEFAULT 0,
	"total_classes" integer DEFAULT 0,
	"completion_certificate" boolean DEFAULT false,
	"certificate_date" date,
	"certificate_url" text,
	"observations" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"title" varchar(200) NOT NULL,
	"description" text,
	"bible_verses" text,
	"order" integer DEFAULT 0,
	"date" date,
	"teacher_id" integer,
	"material_url" text,
	"video_url" text,
	"duration" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"event_type" "event_type" DEFAULT 'service',
	"banner_url" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"location" text,
	"capacity" integer,
	"registered_count" integer DEFAULT 0,
	"has_qr_code" boolean DEFAULT false,
	"qr_code_url" text,
	"ministry_id" integer,
	"organizer_id" integer,
	"is_public" boolean DEFAULT true,
	"status" varchar(50) DEFAULT 'upcoming',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"member_id" integer,
	"ministry_id" integer,
	"event_id" integer,
	"category" varchar(100),
	"subcategory" varchar(100),
	"payment_method" varchar(50),
	"receipt_number" varchar(50),
	"transaction_date" date NOT NULL,
	"notes" text,
	"recorded_by" integer,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"category" "item_category" NOT NULL,
	"description" text,
	"serial_number" varchar(100),
	"brand" varchar(100),
	"model" varchar(100),
	"quantity" integer DEFAULT 1,
	"location" varchar(150),
	"responsible_id" integer,
	"purchase_date" date,
	"purchase_price" numeric(12, 2),
	"condition" varchar(50) DEFAULT 'good',
	"qr_code_url" text,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "library_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"author" varchar(150),
	"isbn" varchar(20),
	"category" varchar(100),
	"description" text,
	"quantity" integer DEFAULT 1,
	"available_count" integer DEFAULT 1,
	"published_year" integer,
	"cover_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "member_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer,
	"related_member_id" integer,
	"relationship_type" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_relationship" UNIQUE("member_id","related_member_id","relationship_type")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"photo_url" text,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"gender" "gender",
	"birth_date" date,
	"marital_status" "marital_status",
	"address" text,
	"phone" varchar(20),
	"cell_phone" varchar(20),
	"email" varchar(150),
	"document_id" varchar(50),
	"join_date" date,
	"baptism_date" date,
	"conversion_date" date,
	"profession" varchar(100),
	"company" varchar(100),
	"facebook" varchar(150),
	"instagram" varchar(150),
	"whatsapp" varchar(20),
	"emergency_contact" varchar(100),
	"emergency_phone" varchar(20),
	"status" "member_status" DEFAULT 'active',
	"ministry_id" integer,
	"leader_id" integer,
	"small_group_id" integer,
	"observations" text,
	"private_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ministries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"leader_id" integer,
	"sub_leader_id" integer,
	"type" varchar(50),
	"status" varchar(20) DEFAULT 'active',
	"meeting_day" varchar(20),
	"meeting_time" varchar(20),
	"meeting_location" varchar(200),
	"meeting_frequency" varchar(20) DEFAULT 'weekly',
	"objectives" text,
	"vision" text,
	"goals" text,
	"budget" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"email" varchar(100),
	"phone" varchar(20),
	"photo_url" text,
	"observations" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ministry_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"ministry_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"role" varchar(100),
	"join_date" date,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pastoral_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer,
	"pastor_id" integer,
	"visit_type" varchar(100),
	"visit_date" timestamp NOT NULL,
	"duration" integer,
	"notes" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"status" varchar(50) DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prayer_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer,
	"requester_name" varchar(150),
	"request" text NOT NULL,
	"category" varchar(100),
	"status" "prayer_status" DEFAULT 'pending',
	"responsible_id" integer,
	"response" text,
	"testimony" text,
	"is_private" boolean DEFAULT false,
	"request_date" date NOT NULL,
	"answered_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sermons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"preacher_id" integer,
	"series" varchar(150),
	"sermon_date" date NOT NULL,
	"audio_url" text,
	"video_url" text,
	"pdf_url" text,
	"presentation_url" text,
	"bible_reference" varchar(150),
	"tags" text,
	"description" text,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "small_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"leader_id" integer,
	"ministry_id" integer,
	"meeting_day" varchar(20),
	"meeting_time" varchar(20),
	"meeting_address" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer,
	"username" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password_hash" text,
	"role" "role" DEFAULT 'user',
	"is_active" boolean DEFAULT true,
	"two_factor_enabled" boolean DEFAULT false,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"email" varchar(150),
	"first_visit_date" date,
	"second_visit_date" date,
	"invited_by" integer,
	"interests" text,
	"decision" text,
	"converted" boolean DEFAULT false,
	"baptism_pending" boolean DEFAULT false,
	"follow_up_notes" text,
	"status" varchar(50) DEFAULT 'new',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bible_courses" ADD CONSTRAINT "bible_courses_teacher_id_members_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_attendance" ADD CONSTRAINT "class_attendance_enrollment_id_course_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."course_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_bible_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."bible_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_student_id_members_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_course_id_bible_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."bible_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_teacher_id_members_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_relationships" ADD CONSTRAINT "member_relationships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_relationships" ADD CONSTRAINT "member_relationships_related_member_id_members_id_fk" FOREIGN KEY ("related_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_leader_id_members_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_sub_leader_id_members_id_fk" FOREIGN KEY ("sub_leader_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;