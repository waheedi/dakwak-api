#require 'rubygems'
#require 'cap_recipes/tasks/apache'
#require 'cap_recipes/tasks/passenger'
#require 'cap_recipes/tasks/rails'
#require 'bundler/capistrano'

set :application, "api"
 # Or: `accurev`, `bzr`, `cvs`, `darcs`, `git`, `mercurial`, `perforce`, `subversion` or `none` 
 dakwak = "new.dakwak.com"
 role :web, dakwak                          # Your HTTP server, Apache/etc
 role :app, dakwak                          # This may be the same as your `Web` server
 #role :db,  dakwak, :primary => true # This is where Rails migrations will run
 
 
 set :deploy_to, "/mnt/app/#{application}"
 set :location, dakwak
 set :user, "root"

 ssh_options[:keys] = %w(/Users/waheedbarghouthi/.ssh/id_rsa)
 

 set :runner, :app
 set :repository,  "git@github.com:waheedi/dakwak-api.git"
 set :branch, 'master'


 set :scm, :git
 set :deploy_via, :remote_cache
# set :git_enable_submodules, 0
 set :keep_releases, 3
 set :use_sudo, true


 # =============================================================================
 # RECIPE INCLUDES
 # =============================================================================



 ssh_options[:paranoid] = false
 default_run_options[:pty] = true
 
 namespace :stalker do

   # start background task server
   task :start, :roles => :app do
     run  "chmod +x /mnt/app/dakwak/current/translate_queue.rb"
     run  "chown ubuntu /mnt/app/dakwak/current/translate_queue.rb"
     run "start-stop-daemon --start  --background --pidfile /mnt/app/stalker.pid  --make-pidfile --startas /mnt/app/dakwak/current/translate_queue.rb -- --daemon" 
   end

   # stop background task server
   task :stop, :roles => :app do
     run "start-stop-daemon --stop --quiet --pidfile /mnt/app/stalker.pid" 
     run "rm /mnt/app/stalker.pid "
   end

 end
 
 namespace :bundler do
   task :start do
    run "cd #{release_path} && /usr/local/rvm/gems/ruby-1.9.2-p290/bin/bundle install && /usr/local/rvm/gems/ruby-1.9.2-p290/bin/bundle update --gemfile #{release_path}/Gemfile --deployment --quiet --without development test"
   end
 end


 namespace :rvm do
   task :start do
		run "/usr/local/rvm/bin/rvm use 1.9.3"
   end
 end
 
 
 namespace :dbseed do
   desc "seeding database"
   task :start, :roles => :web do
     run "cd #{current_path} && rake db:seed RAILS_ENV=production"
   end
 end
 
 namespace :beanstalkd do
   desc "start beanstalkd"
   task :start, :roles => :web do
     sudo "/etc/init.d/beanstalkd start"
   end
   desc "stop beanstalkd"
   task :stop, :roles => :web do
     sudo "/etc/init.d/beanstalkd stop"
   end
 end
 
# before "rails:ping", "bundler:start" 
	#before "bundle:install", "rvm:start"
#	after "deploy", "rvm:trust_rvmrc"
 #before "deploy:update_code", "thin:setup"
# after "rails:repair_permissions", "fix:permissions", "fix:chown_to_www_data"
namespace :deploy do
  task :cold do
    deploy.update
    deploy.start
		
  end
end


namespace :rails do
  namespace :sweep do 
    task :cache, :roles => :app do
    end    
  end
end
