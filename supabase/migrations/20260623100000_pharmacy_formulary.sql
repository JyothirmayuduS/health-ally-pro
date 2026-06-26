-- Pharmacy formulary (hospital medicine catalog + selling prices)
CREATE TABLE IF NOT EXISTS public.pharmacy_formulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  barcode TEXT,
  generic_name TEXT NOT NULL,
  brand_names TEXT[] DEFAULT '{}',
  strength TEXT NOT NULL,
  form TEXT NOT NULL DEFAULT 'Tablet',
  route TEXT NOT NULL DEFAULT 'Oral',
  rx_required BOOLEAN NOT NULL DEFAULT true,
  controlled_schedule TEXT,
  storage_zone TEXT NOT NULL DEFAULT 'main',
  location_code TEXT,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  pack_size INTEGER NOT NULL DEFAULT 1,
  purchase_cost NUMERIC(12, 4) NOT NULL DEFAULT 0,
  unit_price NUMERIC(12, 4) NOT NULL DEFAULT 0,
  pack_mrp NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gst_rate SMALLINT NOT NULL DEFAULT 5 CHECK (gst_rate IN (0, 5, 12, 18)),
  price_updated_at TIMESTAMPTZ,
  price_updated_by UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  counseling TEXT,
  high_alert BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_formulary_hospital ON public.pharmacy_formulary(hospital_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_formulary_generic ON public.pharmacy_formulary(hospital_id, generic_name);

-- Stock batches with purchase cost (procurement)
CREATE TABLE IF NOT EXISTS public.pharmacy_stock_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  formulary_id UUID NOT NULL REFERENCES public.pharmacy_formulary(id) ON DELETE CASCADE,
  lot TEXT NOT NULL,
  expiry DATE NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0 CHECK (qty >= 0),
  reserved_qty INTEGER NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
  purchase_cost_per_unit NUMERIC(12, 4),
  vendor TEXT,
  po_reference TEXT,
  location_override TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'quarantine', 'expired')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_batches_formulary ON public.pharmacy_stock_batches(formulary_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_batches_expiry ON public.pharmacy_stock_batches(hospital_id, expiry);

COMMENT ON TABLE public.pharmacy_formulary IS 'Hospital medicine catalog — selling price per dispensable unit, pack MRP, GST';
COMMENT ON COLUMN public.pharmacy_formulary.unit_price IS 'Selling price per tablet/capsule/dose (used for Rx billing)';
COMMENT ON COLUMN public.pharmacy_formulary.purchase_cost IS 'Default/weighted purchase cost per unit';
COMMENT ON TABLE public.pharmacy_stock_batches IS 'Inventory lots — purchase cost captured on goods receipt';
