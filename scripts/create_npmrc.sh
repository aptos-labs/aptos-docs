#!/bin/bash

cat > .npmrc << 'EOF'
@aptos-foundation:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
registry=https://registry.npmjs.org/
always-auth=true
EOF
