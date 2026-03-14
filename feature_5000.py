import os
import subprocess
import json
import re

def analyze_breakpoints(repo_path: str, issue_id: str) -> dict:
    try:
        # Check if the repository exists
        if not os.path.exists(repo_path):
            raise FileNotFoundError(f"The repository path {repo_path} does not exist.")

        # Clone the repository if it does not exist
        if not os.path.isdir(os.path.join(repo_path, '.git')):
            subprocess.run(['git', 'clone', repo_path], check=True)

        # Navigate to the repository directory
        os.chdir(os.path.join(repo_path, 'app'))

        # List all files with '.ts' extension for TypeScript files
        ts_files = [f for f in os.listdir('.') if f.endswith('.ts')]

        # Initialize a dictionary to store the analysis
        analysis = {'issue_id': issue_id, 'files_analyzed': [], 'breakpoint_issues': []}

        # Analyze each TypeScript file for breakpoints
        for ts_file in ts_files:
            with open(ts_file, 'r', encoding='utf-8') as file:
                content = file.read()
                breakpoints = re.findall(r'\bbreak\b', content)

                # Count the number of breakpoints in the file
                breakpoint_count = len(breakpoints)

                # If there are no breakpoints, add to issues list
                if breakpoint_count == 0:
                    analysis['breakpoint_issues'].append({'file': ts_file, 'message': 'No breakpoints found.'})

                # Store the analysis for the file
                analysis['files_analyzed'].append({
                    'file': ts_file,
                    'breakpoint_count': breakpoint_count
                })

        return analysis

    except Exception as e:
        return {'error': str(e)}

# Test cases
if __name__ == "__main__":
    # Test with the provided repository
    repo_url = 'https://github.com/tihansen/words-challenge/tree/master/app'
    analysis_result = analyze_breakpoints(repo_url, '5000')
    print(json.dumps(analysis_result, indent=4))