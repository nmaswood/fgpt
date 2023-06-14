export const BASIC_PROMPT = `
Parse the document below. Output your response conforming to the json schema provided:

{
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "description": "An interesting question a user could help ask to understand the document.",
            "items": {
                "type": "string"
            }
        }
    }
}

{document}
`;
