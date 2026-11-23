ALTER TABLE public.facilities ADD COLUMN is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.membership_plans ADD COLUMN amount numeric;
UPDATE public.membership_plans SET amount = price;
COMMENT ON COLUMN public.membership_plans.price IS 'DEPRECATED: replaced by nullable amount; legacy required field is not a quoted price';
ALTER TABLE public.gym_settings ADD COLUMN hours_confirmed boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.validate_gym_content() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF TG_TABLE_NAME='facilities' THEN IF NEW.is_published AND NOT NEW.is_verified THEN RAISE EXCEPTION 'Verify this facility before publishing'; END IF; ELSIF TG_TABLE_NAME='membership_plans' THEN IF NEW.amount < 0 OR NEW.duration_days <= 0 THEN RAISE EXCEPTION 'Enter a valid price and duration'; END IF; IF NEW.is_published AND NEW.amount IS NULL THEN RAISE EXCEPTION 'Add a price before publishing'; END IF; END IF; RETURN NEW; END $$;
CREATE TRIGGER facilities_publication BEFORE INSERT OR UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.validate_gym_content();
CREATE TRIGGER plans_publication BEFORE INSERT OR UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.validate_gym_content();
CREATE TABLE public.members(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),gym_id uuid NOT NULL REFERENCES public.gyms(id),user_id uuid,full_name text NOT NULL,phone text NOT NULL,email text,plan_id uuid REFERENCES public.membership_plans(id),starts_on date NOT NULL,ends_on date NOT NULL,status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','cancelled')),created_at timestamptz NOT NULL DEFAULT now(),CHECK(ends_on>=starts_on));
GRANT SELECT,INSERT,UPDATE ON public.members TO authenticated; GRANT ALL ON public.members TO service_role;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage members" ON public.members FOR ALL TO authenticated USING(public.has_gym_role(gym_id,ARRAY['owner','manager','receptionist']::public.app_role[])) WITH CHECK(public.has_gym_role(gym_id,ARRAY['owner','manager','receptionist']::public.app_role[]));
CREATE POLICY "members read own membership" ON public.members FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE UNIQUE INDEX members_gym_user ON public.members(gym_id,user_id) WHERE user_id IS NOT NULL;
CREATE TABLE public.attendance(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),gym_id uuid NOT NULL REFERENCES public.gyms(id),member_id uuid NOT NULL REFERENCES public.members(id),checked_in_at timestamptz NOT NULL DEFAULT now(),method text NOT NULL,actor_id uuid NOT NULL);
GRANT SELECT ON public.attendance TO authenticated; GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff attendance read" ON public.attendance FOR SELECT TO authenticated USING(public.has_gym_role(gym_id,ARRAY['owner','manager','receptionist']::public.app_role[]));
CREATE POLICY "member attendance read" ON public.attendance FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.user_id=auth.uid()));
CREATE INDEX attendance_member_time ON public.attendance(member_id,checked_in_at DESC);
CREATE TABLE public.attendance_tokens(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),gym_id uuid NOT NULL REFERENCES public.gyms(id),member_id uuid REFERENCES public.members(id),token_hash text NOT NULL UNIQUE,kind text NOT NULL CHECK(kind IN ('member','entrance')),issued_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL,used_at timestamptz);
GRANT ALL ON public.attendance_tokens TO service_role; ALTER TABLE public.attendance_tokens ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.attendance_attempts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.attendance_attempts TO service_role; ALTER TABLE public.attendance_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX attendance_attempts_actor_time ON public.attendance_attempts(actor_id,created_at);
CREATE TABLE public.attendance_redemptions(token_id uuid NOT NULL REFERENCES public.attendance_tokens(id),member_id uuid NOT NULL REFERENCES public.members(id),PRIMARY KEY(token_id,member_id));
GRANT ALL ON public.attendance_redemptions TO service_role; ALTER TABLE public.attendance_redemptions ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.validate_member() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF length(trim(NEW.full_name))<2 OR NEW.phone !~ '^\+?[0-9]{10,15}$' THEN RAISE EXCEPTION 'Enter valid member details'; END IF;
IF NEW.plan_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.membership_plans WHERE id=NEW.plan_id AND gym_id=NEW.gym_id) THEN RAISE EXCEPTION 'Plan belongs to another gym'; END IF;
IF NEW.user_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=NEW.user_id) THEN RAISE EXCEPTION 'Member account does not exist'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER member_validation BEFORE INSERT OR UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.validate_member();
CREATE FUNCTION public.link_member_account(_gym uuid,_member uuid,_email text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE uid uuid; BEGIN
IF NOT public.has_gym_role(_gym,ARRAY['owner','manager','receptionist']::public.app_role[]) THEN RAISE EXCEPTION 'Not authorized'; END IF;
SELECT id INTO uid FROM auth.users WHERE lower(email)=lower(trim(_email)) AND email_confirmed_at IS NOT NULL;
IF uid IS NULL THEN RAISE EXCEPTION 'Ask the member to sign up and verify this email first'; END IF;
UPDATE public.members SET user_id=uid WHERE id=_member AND gym_id=_gym;
IF NOT FOUND THEN RAISE EXCEPTION 'Member not found'; END IF; RETURN true; END $$;
REVOKE ALL ON FUNCTION public.link_member_account(uuid,uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.link_member_account(uuid,uuid,text) TO authenticated;
ALTER TABLE public.trainers ADD COLUMN photo_path text;
CREATE POLICY "gym photo editors insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='gym-photos' AND EXISTS(SELECT 1 FROM public.gyms g WHERE g.id::text=(storage.foldername(objects.name))[1] AND public.has_gym_role(g.id,ARRAY['owner','manager']::public.app_role[])));
CREATE POLICY "gym photo editor read" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='gym-photos' AND EXISTS(SELECT 1 FROM public.gyms g WHERE g.id::text=(storage.foldername(objects.name))[1] AND public.has_gym_role(g.id,ARRAY['owner','manager']::public.app_role[])));
CREATE POLICY "published trainer photo read" ON storage.objects FOR SELECT TO anon,authenticated USING(bucket_id='gym-photos' AND EXISTS(SELECT 1 FROM public.trainers t WHERE t.photo_path=name AND t.is_published AND t.is_active));
CREATE POLICY "gym photo editor delete" ON storage.objects FOR DELETE TO authenticated USING(bucket_id='gym-photos' AND EXISTS(SELECT 1 FROM public.gyms g WHERE g.id::text=(storage.foldername(objects.name))[1] AND public.has_gym_role(g.id,ARRAY['owner','manager']::public.app_role[])));
CREATE FUNCTION public.validate_gym_hours() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE h jsonb; daynames text[]:=ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']; i integer:=0; BEGIN
IF NEW.hours_confirmed THEN
IF jsonb_typeof(NEW.hours)<>'array' OR jsonb_array_length(NEW.hours)<>7 THEN RAISE EXCEPTION 'Enter the complete weekly schedule'; END IF;
FOR h IN SELECT * FROM jsonb_array_elements(NEW.hours) LOOP i:=i+1;
IF h->>'day' IS DISTINCT FROM daynames[i] OR h->>'closed' IS NULL OR h->>'closed' NOT IN ('true','false') THEN RAISE EXCEPTION 'Enter every day in order'; END IF;
IF h->>'closed'='false' AND (coalesce(h->>'open','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' OR coalesce(h->>'close','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') THEN RAISE EXCEPTION 'Enter valid opening and closing times'; END IF;
END LOOP; END IF; RETURN NEW; END $$;
CREATE TRIGGER gym_hours_validation BEFORE INSERT OR UPDATE ON public.gym_settings FOR EACH ROW EXECUTE FUNCTION public.validate_gym_hours();
CREATE FUNCTION public.validate_trainer_photo() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NEW.photo_path IS NOT NULL AND split_part(NEW.photo_path,'/',1)<>NEW.gym_id::text THEN RAISE EXCEPTION 'Photo belongs to another gym'; END IF; RETURN NEW; END $$;
CREATE TRIGGER trainer_photo_validation BEFORE INSERT OR UPDATE ON public.trainers FOR EACH ROW EXECUTE FUNCTION public.validate_trainer_photo();
CREATE TABLE public.gym_attendance_points (
 gym_id uuid PRIMARY KEY REFERENCES public.gyms(id), id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(), mode text NOT NULL DEFAULT 'rotating' CHECK(mode IN ('rotating','printed')), latitude double precision, longitude double precision, radius_metres integer NOT NULL DEFAULT 75 CHECK(radius_metres BETWEEN 50 AND 100), location_verified boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), CHECK(latitude BETWEEN -90 AND 90), CHECK(longitude BETWEEN -180 AND 180), CHECK(NOT location_verified OR (latitude IS NOT NULL AND longitude IS NOT NULL))
);
GRANT SELECT ON public.gym_attendance_points TO authenticated; GRANT ALL ON public.gym_attendance_points TO service_role;
ALTER TABLE public.gym_attendance_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gym members and staff read attendance point" ON public.gym_attendance_points FOR SELECT TO authenticated USING(public.has_gym_role(gym_id,ARRAY['owner','manager','receptionist']::public.app_role[]) OR EXISTS(SELECT 1 FROM public.members WHERE members.gym_id=gym_attendance_points.gym_id AND user_id=auth.uid()));
ALTER TABLE public.attendance ADD COLUMN attendance_day date, ADD COLUMN verification_status text NOT NULL DEFAULT 'legacy', ADD COLUMN staff_override boolean NOT NULL DEFAULT false, ADD COLUMN override_reason text;
CREATE UNIQUE INDEX attendance_one_verified_visit_per_day ON public.attendance(gym_id,member_id,attendance_day) WHERE attendance_day IS NOT NULL;
ALTER TABLE public.attendance_attempts ADD COLUMN gym_id uuid REFERENCES public.gyms(id), ADD COLUMN member_id uuid REFERENCES public.members(id), ADD COLUMN device_id uuid, ADD COLUMN session_id text, ADD COLUMN outcome text NOT NULL DEFAULT 'legacy', ADD COLUMN reason text, ADD COLUMN distance_metres double precision, ADD COLUMN accuracy_metres double precision, ADD COLUMN resolved_by uuid, ADD COLUMN resolved_at timestamptz;
GRANT SELECT ON public.attendance_attempts TO authenticated;
CREATE POLICY "read own or gym staff scan attempts" ON public.attendance_attempts FOR SELECT TO authenticated USING(actor_id=auth.uid() OR public.has_gym_role(gym_id,ARRAY['owner','manager','receptionist']::public.app_role[]));
CREATE INDEX attendance_attempts_gym_device_time ON public.attendance_attempts(gym_id,device_id,created_at);
CREATE FUNCTION public.configure_attendance_point(_gym uuid,_mode text,_lat double precision,_lng double precision,_radius integer,_verified boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p public.gym_attendance_points; BEGIN
IF NOT public.has_gym_role(_gym,ARRAY['owner','manager']::public.app_role[]) THEN RAISE EXCEPTION 'Not authorized'; END IF;
INSERT INTO public.gym_attendance_points(gym_id,mode,latitude,longitude,radius_metres,location_verified) VALUES(_gym,_mode,_lat,_lng,_radius,_verified) ON CONFLICT(gym_id) DO UPDATE SET mode=EXCLUDED.mode,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,radius_metres=EXCLUDED.radius_metres,location_verified=EXCLUDED.location_verified,updated_at=now() RETURNING * INTO p;
INSERT INTO public.audit_logs(gym_id,actor_id,action,entity,entity_id,details) VALUES(_gym,auth.uid(),'attendance.settings','gym_attendance_points',p.id,jsonb_build_object('mode',_mode,'radius',_radius,'verified',_verified));
RETURN to_jsonb(p); END $$;
REVOKE ALL ON FUNCTION public.configure_attendance_point(uuid,text,double precision,double precision,integer,boolean) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.configure_attendance_point(uuid,text,double precision,double precision,integer,boolean) TO authenticated;
CREATE FUNCTION public.issue_attendance_token(_gym uuid,_kind text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p public.gym_attendance_points; tok text; expiry timestamptz; BEGIN
IF auth.uid() IS NULL OR NOT public.has_gym_role(_gym,ARRAY['owner','manager','receptionist']::public.app_role[]) OR _kind<>'entrance' THEN RAISE EXCEPTION 'Only staff can display the official entrance'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(_gym::text,31));
SELECT * INTO p FROM public.gym_attendance_points WHERE gym_id=_gym;
IF p.id IS NULL THEN RAISE EXCEPTION 'Configure the entrance point first'; END IF;
IF p.mode='printed' THEN RETURN jsonb_build_object('token','gymos:point:'||p.id::text,'expiresAt',null,'kind','printed'); END IF;
IF EXISTS(SELECT 1 FROM public.attendance_tokens WHERE gym_id=_gym AND kind='entrance' AND used_at IS NULL AND expires_at>now()) THEN RETURN jsonb_build_object('waiting',true,'expiresAt',(SELECT max(expires_at) FROM public.attendance_tokens WHERE gym_id=_gym AND kind='entrance' AND used_at IS NULL AND expires_at>now())); END IF;
tok:=gen_random_uuid()::text||gen_random_uuid()::text; expiry:=now()+interval '30 seconds';
INSERT INTO public.attendance_tokens(gym_id,token_hash,kind,issued_by,expires_at) VALUES(_gym,encode(sha256(convert_to(tok,'UTF8')),'hex'),'entrance',auth.uid(),expiry);
RETURN jsonb_build_object('token','gymos:challenge:'||tok,'expiresAt',expiry,'kind','rotating'); END $$;
REVOKE ALL ON FUNCTION public.issue_attendance_token(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.issue_attendance_token(uuid,text) TO authenticated;
CREATE FUNCTION public.redeem_attendance_token(_gym uuid,_token text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN RETURN jsonb_build_object('error','Legacy check-in disabled. Scan the official entrance from your member portal.'); END $$;
REVOKE ALL ON FUNCTION public.redeem_attendance_token(uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.request_entrance_checkin(_gym uuid,_payload text,_device uuid,_lat double precision,_lng double precision,_accuracy double precision,_location_status text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE m public.members; p public.gym_attendance_points; t public.attendance_tokens; outcome text; msg text; attempt uuid; aid uuid; dist double precision; today date:=(now() AT TIME ZONE 'Asia/Kolkata')::date; sess text:=coalesce(auth.jwt()->>'session_id','unknown'); cooldown integer; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(_device::text,32)); PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,33));
SELECT * INTO m FROM public.members WHERE gym_id=_gym AND user_id=auth.uid() FOR UPDATE;
IF m.id IS NULL THEN RAISE EXCEPTION 'No linked member access to this gym'; END IF;
IF (SELECT count(*) FROM public.attendance_attempts WHERE actor_id=auth.uid() AND created_at>now()-interval '1 minute')>=10 OR (SELECT count(*) FROM public.attendance_attempts WHERE gym_id=_gym AND device_id=_device AND created_at>now()-interval '1 minute')>=20 THEN outcome:='rate_limited'; msg:='Too many scans. Wait one minute.';
ELSIF m.status<>'active' OR m.starts_on>today OR m.ends_on<today THEN outcome:='ineligible'; msg:='An active, unexpired membership is required.';
ELSE
SELECT * INTO p FROM public.gym_attendance_points WHERE gym_id=_gym;
IF p.id IS NULL THEN outcome:='invalid'; msg:='The gym entrance is not configured.';
ELSIF p.mode='printed' AND _payload='gymos:point:'||p.id::text THEN outcome:='presence';
ELSIF p.mode='rotating' AND _payload LIKE 'gymos:challenge:%' AND length(_payload)<=150 THEN
SELECT * INTO t FROM public.attendance_tokens WHERE gym_id=_gym AND kind='entrance' AND token_hash=encode(sha256(convert_to(substring(_payload FROM 17),'UTF8')),'hex');
IF t.id IS NULL THEN outcome:='invalid'; msg:='Invalid gym QR challenge.'; ELSIF t.expires_at<=now() OR t.used_at IS NOT NULL THEN outcome:='expired'; msg:='QR expired. Scan the current entrance display.'; ELSE outcome:='presence'; END IF;
ELSE outcome:='invalid'; msg:='Scan the official QR for this gym and selected mode.'; END IF;
END IF;
IF outcome='presence' THEN
SELECT checkin_cooldown_minutes INTO cooldown FROM public.gym_settings WHERE gym_id=_gym;
IF EXISTS(SELECT 1 FROM public.attendance WHERE member_id=m.id AND (checked_in_at AT TIME ZONE 'Asia/Kolkata')::date=today) OR EXISTS(SELECT 1 FROM public.attendance WHERE member_id=m.id AND checked_in_at>now()-make_interval(mins=>coalesce(cooldown,240))) THEN outcome:='duplicate'; msg:='Already checked in. Your attendance is recorded.';
ELSE
IF p.location_verified AND _location_status='available' AND _lat BETWEEN -90 AND 90 AND _lng BETWEEN -180 AND 180 AND _accuracy>=0 AND _accuracy<=p.radius_metres THEN
 dist:=6371000*2*asin(sqrt(least(1.0,power(sin(radians(_lat-p.latitude)/2),2)+cos(radians(p.latitude))*cos(radians(_lat))*power(sin(radians(_lng-p.longitude)/2),2))));
END IF;
IF dist IS NOT NULL AND dist+_accuracy<=p.radius_metres THEN outcome:='verified'; msg:='Checked in successfully.';
ELSE outcome:='pending'; msg:=CASE WHEN NOT p.location_verified THEN 'Gym location awaits owner verification.' WHEN _location_status<>'available' THEN 'Location permission or reception is unavailable.' WHEN dist IS NOT NULL AND dist>p.radius_metres THEN 'Reported location is outside the gym radius.' ELSE 'GPS accuracy is inconclusive.' END||' Receptionist confirmation is required.'; END IF;
END IF; END IF;
IF outcome='pending' AND EXISTS(SELECT 1 FROM public.attendance_attempts WHERE member_id=m.id AND outcome='pending' AND created_at>now()-interval '15 minutes') THEN RETURN jsonb_build_object('status','pending','message','A receptionist confirmation is already pending.'); END IF;
INSERT INTO public.attendance_attempts(actor_id,gym_id,member_id,device_id,session_id,outcome,reason,distance_metres,accuracy_metres) VALUES(auth.uid(),_gym,m.id,_device,sess,outcome,msg,dist,CASE WHEN _accuracy>=0 AND _accuracy<=100000 THEN _accuracy ELSE null END) RETURNING id INTO attempt;
IF outcome='verified' THEN
INSERT INTO public.attendance(gym_id,member_id,actor_id,method,attendance_day,verification_status) VALUES(_gym,m.id,auth.uid(),p.mode,today,'qr_location') RETURNING id INTO aid;
IF t.id IS NOT NULL THEN INSERT INTO public.attendance_redemptions(token_id,member_id) VALUES(t.id,m.id); END IF;
INSERT INTO public.audit_logs(gym_id,actor_id,action,entity,entity_id,details) VALUES(_gym,auth.uid(),'attendance.checkin','attendance',aid,jsonb_build_object('attempt',attempt,'session',sess,'device',_device,'method',p.mode));
END IF;
RETURN jsonb_build_object('status',outcome,'message',msg,'attemptId',attempt,'id',aid,'checkedInAt',CASE WHEN aid IS NOT NULL THEN now() ELSE null END);
END $$;
REVOKE ALL ON FUNCTION public.request_entrance_checkin(uuid,text,uuid,double precision,double precision,double precision,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.request_entrance_checkin(uuid,text,uuid,double precision,double precision,double precision,text) TO authenticated;
CREATE FUNCTION public.resolve_attendance_exception(_gym uuid,_attempt uuid,_approve boolean,_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE a public.attendance_attempts; m public.members; aid uuid; today date:=(now() AT TIME ZONE 'Asia/Kolkata')::date; cooldown integer; BEGIN
IF NOT public.has_gym_role(_gym,ARRAY['owner','manager','receptionist']::public.app_role[]) THEN RAISE EXCEPTION 'Not authorized'; END IF;
IF length(trim(_reason))<5 OR length(_reason)>500 THEN RAISE EXCEPTION 'A confirmation reason is required'; END IF;
SELECT * INTO a FROM public.attendance_attempts WHERE id=_attempt AND gym_id=_gym FOR UPDATE;
IF a.id IS NULL OR a.outcome<>'pending' OR a.created_at<now()-interval '15 minutes' THEN RAISE EXCEPTION 'Request is no longer pending. Ask the member to scan again.'; END IF;
SELECT * INTO m FROM public.members WHERE id=a.member_id AND gym_id=_gym FOR UPDATE;
IF _approve THEN
IF m.id IS NULL OR m.status<>'active' OR m.starts_on>today OR m.ends_on<today THEN RAISE EXCEPTION 'Member is not eligible'; END IF;
SELECT checkin_cooldown_minutes INTO cooldown FROM public.gym_settings WHERE gym_id=_gym;
IF EXISTS(SELECT 1 FROM public.attendance WHERE member_id=m.id AND ((checked_in_at AT TIME ZONE 'Asia/Kolkata')::date=today OR checked_in_at>now()-make_interval(mins=>coalesce(cooldown,240)))) THEN RAISE EXCEPTION 'Attendance already recorded'; END IF;
INSERT INTO public.attendance(gym_id,member_id,actor_id,method,attendance_day,verification_status,staff_override,override_reason) VALUES(_gym,m.id,auth.uid(),'receptionist',today,'staff_confirmed',true,trim(_reason)) RETURNING id INTO aid;
END IF;
UPDATE public.attendance_attempts SET outcome=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,resolved_by=auth.uid(),resolved_at=now() WHERE id=a.id;
INSERT INTO public.audit_logs(gym_id,actor_id,action,entity,entity_id,details) VALUES(_gym,auth.uid(),'attendance.exception','attendance_attempts',a.id,jsonb_build_object('approved',_approve,'reason',trim(_reason),'attendance',aid));
RETURN jsonb_build_object('ok',true,'id',aid); END $$;
REVOKE ALL ON FUNCTION public.resolve_attendance_exception(uuid,uuid,boolean,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.resolve_attendance_exception(uuid,uuid,boolean,text) TO authenticated;
CREATE FUNCTION public.attendance_home(_gym uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE m public.members; staff boolean; today date:=(now() AT TIME ZONE 'Asia/Kolkata')::date; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
staff:=public.has_gym_role(_gym,ARRAY['owner','manager','receptionist']::public.app_role[]); SELECT * INTO m FROM public.members WHERE gym_id=_gym AND user_id=auth.uid();
IF NOT staff AND m.id IS NULL THEN RAISE EXCEPTION 'No gym access'; END IF;
RETURN jsonb_build_object('today',today,'serverNow',now(),'point',(SELECT to_jsonb(p) FROM public.gym_attendance_points p WHERE gym_id=_gym),'staff',staff,
'visits',coalesce((SELECT jsonb_agg(v ORDER BY v.checked_in_at DESC) FROM (SELECT a.*,x.full_name,x.status AS member_status FROM public.attendance a JOIN public.members x ON x.id=a.member_id WHERE a.gym_id=_gym AND (staff OR a.member_id=m.id) AND a.checked_in_at>=((today-90)::timestamp AT TIME ZONE 'Asia/Kolkata')) v),'[]'::jsonb),
'attempts',coalesce((SELECT jsonb_agg(v ORDER BY v.created_at DESC) FROM (SELECT a.id,a.member_id,x.full_name,a.created_at,a.outcome,a.reason,a.distance_metres,a.accuracy_metres,(a.session_id<>'unknown' AND EXISTS(SELECT 1 FROM public.attendance_attempts old WHERE old.member_id=a.member_id AND old.outcome IN ('verified','approved') AND old.session_id<>a.session_id)) AS new_session FROM public.attendance_attempts a JOIN public.members x ON x.id=a.member_id WHERE a.gym_id=_gym AND (staff OR a.actor_id=auth.uid()) ORDER BY a.created_at DESC LIMIT 100) v),'[]'::jsonb),
'stats',(SELECT jsonb_build_object('total',count(*),'month',count(*) FILTER(WHERE (checked_in_at AT TIME ZONE 'Asia/Kolkata')::date>=date_trunc('month',today)::date),'week',count(*) FILTER(WHERE (checked_in_at AT TIME ZONE 'Asia/Kolkata')::date>=date_trunc('week',today)::date),'today',count(DISTINCT member_id) FILTER(WHERE (checked_in_at AT TIME ZONE 'Asia/Kolkata')::date=today),'lastVisit',max(checked_in_at)) FROM public.attendance WHERE gym_id=_gym AND (staff OR member_id=m.id)),
'counts',CASE WHEN staff THEN jsonb_build_object('members',(SELECT count(*) FROM public.members WHERE gym_id=_gym),'active',(SELECT count(*) FROM public.members WHERE gym_id=_gym AND status='active' AND starts_on<=today AND ends_on>=today),'expiring',(SELECT count(*) FROM public.members WHERE gym_id=_gym AND status='active' AND ends_on BETWEEN today AND today+7),'leads',(SELECT count(*) FROM public.leads WHERE gym_id=_gym AND created_at>=date_trunc('month',today)::date)) ELSE null END); END $$;
REVOKE ALL ON FUNCTION public.attendance_home(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.attendance_home(uuid) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_attempts;