PROJECT_ROOT=$1
export NODE_VERSION=0.10.40
cd ${PROJECT_ROOT} && npm install && make all
