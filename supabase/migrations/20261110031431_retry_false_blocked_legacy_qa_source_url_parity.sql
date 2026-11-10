update public.video_generation_requests
set content = (
  (
    content
    - 'automatedVideoQa'
    - 'qualityReview'
    - 'approvalStatus'
    - 'approvalReviewerId'
    - 'approvalReviewedAt'
    - 'approvalSnapshotHash'
  )
  || jsonb_build_object(
    'legacyVideoQaHistory',
    coalesce(
      case
        when jsonb_typeof(content->'legacyVideoQaHistory') = 'array'
          then content->'legacyVideoQaHistory'
        else '[]'::jsonb
      end,
      '[]'::jsonb
    ) || jsonb_build_array(
      jsonb_build_object(
        'recordedAt', now(),
        'status', 'blocked',
        'approvalStatus', content->>'approvalStatus',
        'approvalReviewerId', content->>'approvalReviewerId',
        'approvalReviewedAt', content->>'approvalReviewedAt',
        'approvalSnapshotHash', content->>'approvalSnapshotHash',
        'qualityReview', content->'qualityReview',
        'automatedVideoQa', content->'automatedVideoQa',
        'retryReason', 'Rechecked after fixing the canonical source URL fallback parity in legacy QA; original source and content hashes were independently confirmed to match the canonical worker computation.'
      )
    )
  )
),
updated_at = now()
where id in (
  'b20824a5-6f28-4955-a805-f74d69578206',
  '9ccbc553-c2e3-4775-960c-90bf00277079',
  '83bd098a-2884-41ed-aaae-c107dd677fbd',
  'be4797ad-fc4d-45b9-9a58-d5b42b25f6a6'
)
and status = 'completed'
and video_url is not null
and category = 'other'
and content->>'sourceType' = 'editorial'
and content->>'aiMode' = 'general_reminder'
and content->>'sourceLabel' = 'محتوى تحريري أصلي من منصة ذِكر'
and nullif(content->>'sourceUrl', '') is null
and content->>'approvalStatus' = 'qa_failed'
and content->>'approvalReviewerId' is null
and content->'automatedVideoQa'->>'status' = 'blocked'
and content->'automatedVideoQa'->>'blockedReason' = 'Revalidated current source text/URL no longer matches the original source hash.'
and content->>'sourceHash' = source_hash
and content->>'contentHash' = content_hash
and content->>'templateVersion' = template_version
and content->'render'->>'templateVersion' = template_version;
