-- Updated Lost and Found Reports Table Structure
-- DROP TABLE IF EXISTS public.lost_found_reports;

CREATE TABLE IF NOT EXISTS public.lost_found_reports
(
    report_id integer NOT NULL DEFAULT nextval('lost_found_reports_report_id_seq'::regclass),
    passenger_id integer NOT NULL,
    report_type character varying(10) COLLATE pg_catalog."default" NOT NULL,
    item_category character varying(50) COLLATE pg_catalog."default" NOT NULL,
    item_description text COLLATE pg_catalog."default" NOT NULL,
    route_number character varying(10) COLLATE pg_catalog."default",
    region_id integer,
    incident_date date NOT NULL,
    incident_time time without time zone NOT NULL,
    contact_email character varying(100) COLLATE pg_catalog."default",
    contact_phone character varying(20) COLLATE pg_catalog."default" NOT NULL,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'active'::character varying,
    item_photo_url text COLLATE pg_catalog."default",
    reward_offered numeric(10,2) DEFAULT 0.00,
    report_reference character varying(20) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '40 days'::interval),
    CONSTRAINT lost_found_reports_pkey PRIMARY KEY (report_id),
    CONSTRAINT lost_found_reports_report_reference_key UNIQUE (report_reference),
    CONSTRAINT lost_found_reports_passenger_id_fkey FOREIGN KEY (passenger_id)
        REFERENCES public.passengers (passenger_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT lost_found_reports_route_number_fkey FOREIGN KEY (route_number)
        REFERENCES public.routes (route_number) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT lost_found_reports_region_id_fkey FOREIGN KEY (region_id)
        REFERENCES public.regions (region_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT lost_found_reports_report_type_check CHECK (report_type::text = ANY (ARRAY['lost'::character varying, 'found'::character varying]::text[])),
    CONSTRAINT lost_found_reports_status_check CHECK (status::text = ANY (ARRAY['active'::character varying, 'matched'::character varying, 'resolved'::character varying, 'expired'::character varying, 'cancelled'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.lost_found_reports
    OWNER to murshid;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lost_found_reports_passenger_id ON public.lost_found_reports(passenger_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_reports_status ON public.lost_found_reports(status);
CREATE INDEX IF NOT EXISTS idx_lost_found_reports_item_category ON public.lost_found_reports(item_category);
CREATE INDEX IF NOT EXISTS idx_lost_found_reports_region_id ON public.lost_found_reports(region_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_reports_created_at ON public.lost_found_reports(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lost_found_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_lost_found_reports_updated_at
    BEFORE UPDATE ON public.lost_found_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_lost_found_reports_updated_at();

-- Function to generate unique report reference
CREATE OR REPLACE FUNCTION generate_report_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.report_reference = 'LF' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEW.report_id::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_generate_report_reference
    BEFORE INSERT ON public.lost_found_reports
    FOR EACH ROW
    EXECUTE FUNCTION generate_report_reference();
