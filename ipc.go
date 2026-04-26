package main

import (
	"encoding/json"
	"errors"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// sockPath returns the unix socket path used for single-instance IPC.
func sockPath() string {
	user := os.Getenv("USER")
	if user == "" {
		user = "puremark"
	}
	return filepath.Join(os.TempDir(), "puremark-"+user+".sock")
}

// filteredArgs returns os.Args[1:] turned into absolute file paths,
// ignoring flags and non-existent entries.
func filteredArgs() []string {
	out := []string{}
	for _, arg := range os.Args[1:] {
		if strings.HasPrefix(arg, "-") {
			continue
		}
		abs, err := filepath.Abs(arg)
		if err != nil {
			continue
		}
		info, err := os.Stat(abs)
		if err != nil || info.IsDir() {
			continue
		}
		out = append(out, abs)
	}
	return out
}

// trySendToPrimary attempts to deliver the current CLI args to an already
// running PureMark instance. Returns true if delivery succeeded, in which
// case this process should exit.
func trySendToPrimary() bool {
	sp := sockPath()
	conn, err := net.DialTimeout("unix", sp, 300*time.Millisecond)
	if err != nil {
		// Stale socket file (no listener) → remove so we can take primary role.
		if errors.Is(err, os.ErrNotExist) {
			return false
		}
		// Connection refused / no listener: drop the orphan socket.
		_ = os.Remove(sp)
		return false
	}
	defer conn.Close()

	payload, _ := json.Marshal(filteredArgs())
	_ = conn.SetWriteDeadline(time.Now().Add(500 * time.Millisecond))
	if _, err := conn.Write(append(payload, '\n')); err != nil {
		return false
	}
	return true
}

// startIPCServer creates the unix socket and dispatches incoming path lists
// to the provided handler. Removes the socket on process exit signals.
func startIPCServer(onPaths func([]string)) error {
	sp := sockPath()
	_ = os.Remove(sp) // clean any stale file we own

	ln, err := net.Listen("unix", sp)
	if err != nil {
		return err
	}
	_ = os.Chmod(sp, 0600)

	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			go handleIPCConn(conn, onPaths)
		}
	}()
	return nil
}

func handleIPCConn(conn net.Conn, onPaths func([]string)) {
	defer conn.Close()
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	var paths []string
	if err := json.NewDecoder(conn).Decode(&paths); err != nil {
		return
	}
	if len(paths) > 0 {
		onPaths(paths)
	}
}

// cleanupIPC removes the socket file (called on shutdown).
func cleanupIPC() {
	_ = os.Remove(sockPath())
}
