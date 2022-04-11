set -e

# Build amalgam
mkdir -p ./output/
rm -f ./output/dao.fc
touch ./output/dao.fc

# Constants
cat ./source/modules/constants.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc

# Utils
cat ./source/modules/utils.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc

# Storage
cat ./source/modules/storage-base.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc
cat ./source/modules/storage-members.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc
cat ./source/modules/storage-proposals.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc
cat ./source/modules/storage-params.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc

# Model
cat ./source/modules/proposals-check.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc
cat ./source/modules/model.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc
cat ./source/modules/proposals-execute.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc

# Get
cat ./source/modules/get.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc

# Ops
cat ./source/modules/ops.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc

# Main
cat ./source/dao.fc >> ./output/dao.fc
echo $'\n' >> ./output/dao.fc

# Build contract

ton-compiler \
    --output ./output/dao.fif \
    --input ./output/dao.fc
ton-compiler \
    --fift \
    --output ./output/dao.cell \
    --input ./output/dao.fif
openssl base64 -A \
    -in ./output/dao.cell  \
    -out ./output/dao.cell.base64