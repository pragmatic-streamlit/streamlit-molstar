set -ex
#export NODE_OPTIONS="--openssl-legacy-provider"
export BROWSER=none
(cd streamlit_molstar/frontend && npm i --legacy-peer-deps && npm run build)
(cd streamlit_molstar/docking/frontend && npm i --legacy-peer-deps && npm run build)
(cd streamlit_molstar/pocket/frontend && npm i --legacy-peer-deps && npm run build)
