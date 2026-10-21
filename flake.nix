{
    description = "dim-example-deno: a dimOS Desktop app with a Deno server and a React/Vite page (`nix build .#dimosApp` -> bin/dimos-app-server)";
    # nixos-25.11's deno is 2.6.10, the version dimos pins for its cockpit
    inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    outputs = { self, nixpkgs }:
        let
            systems = [ "aarch64-darwin" "x86_64-darwin" "x86_64-linux" "aarch64-linux" ];
            forAll = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
            # node_modules' hash, per system: the npm packages' native parts (rollup, esbuild) differ by OS and CPU.
            # After changing deno.json's imports or deno.lock: `deno task update-hashes` (this machine's system; the others
            # the same way on a machine of that system, or set it to "" and take the "got:" from CI's nix job).
            nodeModulesHash = {
                aarch64-darwin = "sha256-J0KKYYKhyCaJGFoQ/O3H858aaT8Zf2GBloEG7Zso8VY=";
                x86_64-darwin = "sha256-2cu/Y/HkG7QkP16cscj+Z9XHQi1zl34KOuXW0MfWos4=";
                x86_64-linux = "sha256-oHzuczKMq2F1Pfk7TQd9OK8qI54TjN9fPOCCaEkoLOw=";
                aarch64-linux = "";
            };
            denoEnv = "export HOME=$TMPDIR DENO_DIR=$TMPDIR/deno DENO_NO_UPDATE_CHECK=1 DENO_NO_PROMPT=1";
            # zenoh-deno from its release tarball: the module plus every platform's native library, loaded from beside
            # the module, so the server needs no network (JSR carries the module but not the libraries). To update: the
            # version and the tarball's hash (its line in the release's SHA256SUMS, as SRI), and backend/deno.json's jsr version.
            zenohDenoRelease = rec {
                version = "0.1.2";
                url = "https://github.com/jeff-hykin/zenoh-deno/releases/download/v${version}/zenoh-deno-v${version}.tar.gz";
                hash = "sha256-fmkmWoRVSJ/sgbIr98i+yV2lyZTPcaCh/FXkzv/sSE0=";
            };
        in {
            packages = forAll (pkgs:
                let
                    files = paths: pkgs.lib.fileset.toSource { root = ./.; fileset = pkgs.lib.fileset.unions paths; };
                    npmFiles = [ ./deno.json ./deno.lock ];
                in rec {
                    # `deno install --frozen` of deno.json's imports (deno.lock pins every package): with network, so fixed-output
                    nodeModules = pkgs.stdenvNoCC.mkDerivation {
                        name = "dim-example-deno-node-modules";
                        src = files npmFiles;
                        nativeBuildInputs = [ pkgs.deno ];
                        buildPhase = ''
                            ${denoEnv}
                            export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
                            deno install --frozen
                            # deno's own cache of the install: not needed to run, and not byte-identical between installs
                            rm -f node_modules/.deno/.setup-cache.bin
                        '';
                        installPhase = "cp -R node_modules $out";
                        dontFixup = true;
                        outputHashMode = "recursive";
                        outputHashAlgo = "sha256";
                        outputHash = nodeModulesHash.${pkgs.stdenv.hostPlatform.system};
                    };
                    # the server's jsr dependencies (backend/deno.json `vendor: true`): fixed-output, the same on every system.
                    # After changing backend/deno.json or backend/deno.lock: `deno task update-hashes`.
                    backendVendor = pkgs.stdenvNoCC.mkDerivation {
                        name = "dim-example-deno-backend-vendor";
                        src = files [ ./backend/deno.json ./backend/deno.lock ];
                        nativeBuildInputs = [ pkgs.deno ];
                        buildPhase = ''
                            ${denoEnv}
                            export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
                            cd backend
                            deno install --frozen
                        '';
                        installPhase = "cp -R vendor $out";
                        dontFixup = true;
                        outputHashMode = "recursive";
                        outputHashAlgo = "sha256";
                        outputHash = "sha256-j2zVKwiZDyIPKkp9TNkwg9m7WEHOBfiOQ6LHWCgd4C8=";
                    };
                    zenohDeno = pkgs.runCommand "zenoh-deno-${zenohDenoRelease.version}" { } ''
                        mkdir $out
                        tar xzf ${pkgs.fetchurl { inherit (zenohDenoRelease) url hash; }} -C $out --strip-components=1
                    '';
                    # the server: its source plus that vendor folder, with zenoh-deno imported from the tarball instead of JSR
                    backend = pkgs.runCommand "dim-example-deno-backend" { nativeBuildInputs = [ pkgs.jq ]; } ''
                        cp -R ${files [ ./backend ]}/backend $out
                        chmod -R u+w $out
                        rm -rf $out/vendor
                        cp -R ${backendVendor} $out/vendor
                        jq --arg mod "file://${zenohDeno}/mod.ts" '.imports["@robotics/zenoh-deno"] = $mod' $out/deno.json > deno.json
                        cp deno.json $out/deno.json
                    '';
                    # the page: `deno task build` (vite) against that node_modules, offline
                    frontend = pkgs.stdenvNoCC.mkDerivation {
                        name = "dim-example-deno-frontend";
                        src = files (npmFiles ++ [ ./index.html ./vite.config.ts ./tools/jsr_from_esm_sh.ts ./src ]);
                        nativeBuildInputs = [ pkgs.deno ];
                        buildPhase = ''
                            ${denoEnv}
                            cp -R ${nodeModules} node_modules
                            chmod -R u+w node_modules
                            deno run -A --cached-only --node-modules-dir=manual npm:vite build
                        '';
                        installPhase = "cp -R dist $out";
                    };
                    # Desktop runs `nix build .#dimosApp`; a bin/dimos-app-server is started with DIMOS_APP and proxied at /apps/<name>/
                    dimosApp = pkgs.writeShellScriptBin "dimos-app-server" ''
                        exec ${pkgs.deno}/bin/deno run -A --no-lock --cached-only --config ${backend}/deno.json ${backend}/main.ts --frontend ${frontend} "$@"
                    '';
                    default = dimosApp;
                });
        };
}
