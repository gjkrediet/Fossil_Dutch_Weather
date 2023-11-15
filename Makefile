identifier := weatherApp

source_file := app.js
snapshot_file := build/files/code/${identifier}
tools_dir := $(if $(WATCH_SDK_PATH),$(WATCH_SDK_PATH),~/fossil/)
package_file := ${identifier}.wapp
package_path := ${package_file}

adb_target := 192.168.1.99:35733
adb_target_dir := /sdcard/q/${package_file}

.PHONY: all build compile pack push connect install clean

all: build push install
build: clean compile pack

compile:
	mkdir -p build/files/code build/files/config
	mkdir -p build/files/code/
	jerry-snapshot generate -f '' app.js -o build/files/code/${identifier}


pack:
	python3 ${tools_dir}tools/pack.py -i build/ -o ${package_path}

copy:
	cp ${package_path} ../../wapp/

push:
	adb push ${package_path} ${adb_target_dir}

connect:
	adb connect ${adb_target}

install:
	adb shell am broadcast \
    -a "nodomain.freeyourgadget.gadgetbridge.Q_UPLOAD_FILE" \
    --es EXTRA_HANDLE APP_CODE \
    --es EXTRA_PATH "${adb_target_dir}" \
	--ez EXTRA_GENERATE_FILE_HEADER false

clean:
	rm -f build/files/code/*
	rm -f *.wapp
