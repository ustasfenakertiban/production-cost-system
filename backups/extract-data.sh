#!/bin/bash

INPUT_FILE="backup_20251006_000001.sql"
OUTPUT_FILE="backup_data_only_ordered.sql"

# Extract COPY blocks for each table in the right order
extract_copy() {
    table_name=$1
    awk "/^COPY public\.$table_name /,/^\\\\\.$/" "$INPUT_FILE"
}

# Clear output file
> "$OUTPUT_FILE"

echo "-- Data-only backup with corrected order" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Correct order: parents first, children later
echo "-- Users" >> "$OUTPUT_FILE"
extract_copy "users" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Material categories (parent of materials)" >> "$OUTPUT_FILE"
extract_copy "material_categories" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Materials" >> "$OUTPUT_FILE"
extract_copy "materials" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Equipment" >> "$OUTPUT_FILE"
extract_copy "equipment" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Employee roles" >> "$OUTPUT_FILE"
extract_copy "employee_roles" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Products (parent of production_processes)" >> "$OUTPUT_FILE"
extract_copy "products" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Production processes (parent of operation_chains)" >> "$OUTPUT_FILE"
extract_copy "production_processes" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Operation chains (parent of production_operations)" >> "$OUTPUT_FILE"
extract_copy "operation_chains" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Production operations" >> "$OUTPUT_FILE"
extract_copy "production_operations" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Operation equipment/materials/roles" >> "$OUTPUT_FILE"
extract_copy "operation_equipment" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
extract_copy "operation_materials" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
extract_copy "operation_roles" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Operation templates" >> "$OUTPUT_FILE"
extract_copy "operation_templates" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
extract_copy "operation_template_equipment" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
extract_copy "operation_template_materials" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
extract_copy "operation_template_roles" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Orders" >> "$OUTPUT_FILE"
extract_copy "orders" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
extract_copy "order_items" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "-- Other tables" >> "$OUTPUT_FILE"
extract_copy "recurring_expenses" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
extract_copy "accounts" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
extract_copy "sessions" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
extract_copy "verificationtokens" >> "$OUTPUT_FILE"

echo "Data extraction complete: $OUTPUT_FILE"
