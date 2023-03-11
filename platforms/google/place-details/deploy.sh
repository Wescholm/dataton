#!/bin/bash

# Get the local file path as the first argument
local_file=$1

# Get the remote server and file path as the second argument
remote_server="ubuntu@54.221.26.50"
remote_file=$2

# Use scp to copy the file to the remote server
scp -i ~/.ssh/server.pem $local_file $remote_server:$remote_file
