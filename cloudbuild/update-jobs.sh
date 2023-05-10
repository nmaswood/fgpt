APPS=$(gcloud run jobs list  | grep job-runner | awk '{print $2}')
for app in $APPS; do
  echo $app
  echo "${_LOCATION}-docker.pkg.dev/$PROJECT_ID/${_REPOSITORY}/job-runner:${SHORT_SHA}"
  echo "${_LOCATION}"
  gcloud beta run jobs update $app --image "${_LOCATION}-docker.pkg.dev/$PROJECT_ID/${_REPOSITORY}/job-runner:${SHORT_SHA}" --region "${_LOCATION}"
done
