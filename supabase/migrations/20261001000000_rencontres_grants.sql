-- ─────────────────────────────────────────────────────────────────────────────
-- PinLove — Mode Rencontres · droits d'accès explicites
--
-- À exécuter APRÈS les 5 migrations Rencontres. Rejouable.
--
-- Les projets Supabase récents n'accordent plus automatiquement les droits
-- de table au rôle « authenticated » : sans ces GRANT, l'app reçoit
-- « permission denied for table … ». Les policies RLS des migrations
-- précédentes continuent de filtrer ligne par ligne ce que chacun voit.
-- ─────────────────────────────────────────────────────────────────────────────

grant usage on schema public to authenticated;

-- Profil Rencontres : lecture et suppression du sien (RLS) ; l'insertion et
-- la modification restent limitées aux colonnes éditables (lot 1), le score
-- de fiabilité n'est jamais modifiable par l'utilisateur.
grant select, delete on public.rencontre_profiles to authenticated;
grant insert (user_id, enabled, intention, first_name, photo_path,
              safety_contact_name, safety_contact_phone, principles_accepted_at)
  on public.rencontre_profiles to authenticated;
grant update (enabled, intention, first_name, photo_path,
              safety_contact_name, safety_contact_phone, principles_accepted_at)
  on public.rencontre_profiles to authenticated;

-- Lieux : nouvelles colonnes (ouverture, pourquoi, clé, souvenir).
grant select, insert, update, delete on public.places to authenticated;

-- Moments et participants : lecture seule (écritures via les fonctions).
grant select on public.moments             to authenticated;
grant select on public.moment_participants to authenticated;

-- Chat du jour J : lecture et envoi (fenêtre imposée par la RLS).
grant select, insert on public.moment_messages to authenticated;

-- Feedback : lecture de son propre retour (écriture via submit_feedback).
grant select, insert on public.feedback to authenticated;

-- Signalements : relecture des siens, création sur colonnes limitées.
grant select on public.reports to authenticated;
grant insert (reporter_id, reported_user_id, moment_id, reason, details)
  on public.reports to authenticated;

-- Notifications : lecture des siennes, et marquer comme lues.
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Appareils (push) : lecture et suppression des siens.
grant select, delete on public.device_tokens to authenticated;

-- Photos : le bucket privé passe par storage (déjà autorisé par Supabase).

-- Recharge le cache de l'API pour prise en compte immédiate.
notify pgrst, 'reload schema';
