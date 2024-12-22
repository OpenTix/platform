PRNUMBER=$steps.find-pr.outputs.PR_NUMBER
DEPLOYENV=feature
HOSTEDZONENAME=dev.opentix.co
TARGETAPP=$github.event.inputs.target

TARGETAPP_CAPITALIZED=$(echo "${TARGETAPP^}")

TARGETSTACK="pr${TARGETAPP_CAPITALIZED}Stack"



npx cdk synth --account 390403894969 --region us-east-1 --require-approval never
npx cdk deploy "$TARGETSTACK" --account 390403894969 --region us-east-1 --require-approval never