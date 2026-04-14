-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "mpesa_paybill" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "suspension_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "route" TEXT,
    "max_capacity" INTEGER NOT NULL DEFAULT 7,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "Operator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "unique_url_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Parent_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "Operator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parent_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "full_name" TEXT NOT NULL,
    "school_name" TEXT,
    "pickup_location" TEXT,
    "dropoff_location" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Child_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Child_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parent_id" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_date" DATETIME,
    "payment_method" TEXT,
    "mpesa_transaction_id" TEXT,
    "invoice_month" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Payment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "driver_id" TEXT,
    "document_type" TEXT NOT NULL,
    "issue_date" DATETIME NOT NULL,
    "expiry_date" DATETIME NOT NULL,
    "file_url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ComplianceDocument_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "Operator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceDocument_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ComplianceAlert_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "ComplianceDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "child_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "checkin_type" TEXT NOT NULL,
    "checkin_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location_lat" DECIMAL,
    "location_lng" DECIMAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "event_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "Operator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PricingConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "model_type" TEXT NOT NULL DEFAULT 'PER_STUDENT',
    "vehicle_base_rate" DECIMAL,
    "per_student_rate" DECIMAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "PricingConfig_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "Operator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_email_key" ON "Operator"("email");

-- CreateIndex
CREATE INDEX "Operator_email_idx" ON "Operator"("email");

-- CreateIndex
CREATE INDEX "Vehicle_operator_id_status_idx" ON "Vehicle"("operator_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_operator_id_license_plate_key" ON "Vehicle"("operator_id", "license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_unique_url_id_key" ON "Parent"("unique_url_id");

-- CreateIndex
CREATE INDEX "Parent_operator_id_idx" ON "Parent"("operator_id");

-- CreateIndex
CREATE INDEX "Parent_phone_idx" ON "Parent"("phone");

-- CreateIndex
CREATE INDEX "Child_parent_id_idx" ON "Child"("parent_id");

-- CreateIndex
CREATE INDEX "Child_vehicle_id_idx" ON "Child"("vehicle_id");

-- CreateIndex
CREATE INDEX "Payment_parent_id_status_idx" ON "Payment"("parent_id", "status");

-- CreateIndex
CREATE INDEX "Payment_invoice_month_idx" ON "Payment"("invoice_month");

-- CreateIndex
CREATE INDEX "ComplianceDocument_operator_id_expiry_date_idx" ON "ComplianceDocument"("operator_id", "expiry_date");

-- CreateIndex
CREATE INDEX "ComplianceDocument_vehicle_id_status_idx" ON "ComplianceDocument"("vehicle_id", "status");

-- CreateIndex
CREATE INDEX "ComplianceAlert_document_id_alert_type_idx" ON "ComplianceAlert"("document_id", "alert_type");

-- CreateIndex
CREATE INDEX "CheckIn_child_id_checkin_time_idx" ON "CheckIn"("child_id", "checkin_time");

-- CreateIndex
CREATE INDEX "ActivityLog_operator_id_timestamp_idx" ON "ActivityLog"("operator_id", "timestamp");

-- CreateIndex
CREATE INDEX "ActivityLog_event_type_idx" ON "ActivityLog"("event_type");

-- CreateIndex
CREATE UNIQUE INDEX "PricingConfig_operator_id_key" ON "PricingConfig"("operator_id");
