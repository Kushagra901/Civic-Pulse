-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "searchVector" tsvector;

-- CreateIndex
CREATE INDEX "Incident_searchVector_idx" ON "Incident" USING GIN ("searchVector");

-- Populate it for existing rows
UPDATE "Incident"
SET "searchVector" =
  to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(category, '')
  );

-- Auto-update trigger so new/updated incidents stay searchable
CREATE OR REPLACE FUNCTION incident_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    to_tsvector('english',
      coalesce(NEW.title, '') || ' ' ||
      coalesce(NEW.description, '') || ' ' ||
      coalesce(NEW.category, '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS incident_search_vector_trigger ON "Incident";

CREATE TRIGGER incident_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Incident"
  FOR EACH ROW EXECUTE FUNCTION incident_search_vector_update();

