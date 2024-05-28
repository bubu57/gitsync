{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"
  services.docker.enable=true;
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.python310
    pkgs.docker
    pkgs.docker-compose
  ];
  # Sets environment variables in the workspace
  env = {};
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];
    workspace = {
      # Runs when a workspace is first created with this `dev.nix` file
      onCreate = {
        npm-install = "npm install";
      };
      # To run something each time the workspace is (re)started, use the `onStart` hook
      onStart = {};
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          # command = ["npm" "start" "--prefix" "web/backend" "--" "--port" "$PORT"];
          # command = ["docker-compose" "up"];
          # command = ["sh" "-c" "git checkout dev && echo $PORT && docker-compose up"];
          command = ["sh" "-c" "cd web/backend && node index.js"];
          manager = "web";
        };
      };
    };
  };
}