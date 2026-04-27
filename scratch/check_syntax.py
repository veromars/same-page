import sys

def check_file(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"File {filename} read successfully. Length: {len(content)}")
        
        # Check for non-ASCII characters in a suspicious way
        for i, char in enumerate(content):
            if ord(char) > 127:
                # Korean characters are fine, but let's see if there are others
                if ord(char) < 0xAC00 or ord(char) > 0xD7A3: # Simple hangul range
                    if ord(char) not in [0x1F319, 0x1F4AB, 0x2601, 0x1F31F]: # Add some common emojis
                        # print(f"Suspicious char at {i}: {repr(char)} (ord: {ord(char)})")
                        pass
        
        # Try to parse as JS? No, I'll just check for unclosed delimiters
        delims = {'(': ')', '[': ']', '{': '}'}
        stack = []
        in_string = None
        in_template = False
        
        for i, char in enumerate(content):
            if in_string:
                if char == in_string and content[i-1] != '\\':
                    in_string = None
                continue
            if in_template:
                if char == '`' and content[i-1] != '\\':
                    in_template = False
                elif char == '$' and i+1 < len(content) and content[i+1] == '{':
                    # Start of interpolation
                    stack.append('${')
                continue
            
            if char in ["'", '"']:
                in_string = char
            elif char == '`':
                in_template = True
            elif char in delims.keys():
                stack.append(char)
            elif char in delims.values():
                if not stack:
                    print(f"Extra closing {char} at {i}")
                    continue
                top = stack.pop()
                if top == '${' and char == '}':
                    continue
                if delims.get(top) != char:
                    print(f"Mismatched {char} at {i}. Expected {delims.get(top)} for {top}")
        
        if stack:
            print(f"Unclosed delimiters: {stack}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_file(sys.argv[1])
