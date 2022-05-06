current_branch=$(git rev-parse --abbrev-ref HEAD)
echo $current_branch
git checkout develop && git pull && git checkout $current_branch && git rebase develop