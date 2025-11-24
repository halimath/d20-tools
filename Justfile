container-image:
    docker buildx build \
        --build-arg version=1.2.3 \
        --build-arg date="$(date "+%Y-%m-%dT%H:%M:%S")" \
        --build-arg vcs_ref=local \
        --build-arg build_number=17 \
        -t d20-tools:latest \
        --load .