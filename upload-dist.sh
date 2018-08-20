cp -r dist image
gsutil rsync -d -r image gs://install-versions.risevision.com/widgets/
gsutil -m acl -r ch -u AllUsers:R gs://install-versions.risevision.com/widgets/image
gsutil -m setmeta -r -h Cache-Control:private,max-age=0 gs://install-versions.risevision.com/widgets/image
