{
    description = "dim-example-deno: a dimOS Desktop app with a Deno server (`nix build .#dimosApp` -> bin/dimos-app-server)";
    inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    outputs = { self, nixpkgs }:
        let
            systems = [ "aarch64-darwin" "x86_64-darwin" "x86_64-linux" "aarch64-linux" ];
            forAll = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
        in {
            # Desktop runs `nix build .#dimosApp`; a bin/dimos-app-server is started with DIMOS_APP and proxied at /apps/<name>/
            packages = forAll (pkgs: rec {
                dimosApp = pkgs.writeShellScriptBin "dimos-app-server" ''
                    exec ${pkgs.deno}/bin/deno run -A --no-lock ${./backend}/main.ts --frontend ${./frontend} "$@"
                '';
                default = dimosApp;
            });
        };
}
