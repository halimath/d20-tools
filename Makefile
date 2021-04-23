VERSION = 0.9.0
BUILD_NUMBER = 7
DATE = $(shell date --iso-8601=seconds)
CWD = $(shell pwd)
VCS_REF = $(shell git rev-parse --short HEAD)

DOCKER = docker
DOCKER_IMAGE_NAME = d20-tools
DOCKER_IMAGE_TAG = $(VERSION)
GITHUB_REPO = halimath/d20-tools

.PHONY: buikd-image save-image push-image

build-image: 
	$(DOCKER) build --build-arg version=$(VERSION) --build-arg build_number=$(BUILD_NUMBER) --build-arg date=$(DATE) --build-arg vcs_ref=$(VCS_REF) -t $(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG) .

save-image: build-image
	$(DOCKER) save $(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG) > $(DOCKER_IMAGE_NAME)-$(DOCKER_IMAGE_TAG).tgz

push-image: build-image
	$(DOCKER) tag $(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG) docker.pkg.github.com/$(GITHUB_REPO)/$(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG)
	$(DOCKER) push docker.pkg.github.com/$(GITHUB_REPO)/$(DOCKER_IMAGE_NAME):$(DOCKER_IMAGE_TAG)
