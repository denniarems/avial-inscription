# Use an official Deno image from the dockerhub
FROM denoland/deno:1.39.2

# Set the working directory in the docker image
WORKDIR /app

# Copy the current directory contents into the container at /app
ADD . /app

# Use an environment variable
ENV KEY=${KEY}

# Run transfer.ts when the container launches
CMD ["run", "--allow-net","--allow-env", "--allow-read", "mint.ts"]
