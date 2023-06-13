export const GUARD_RAILS_PROMPT = `<rail version="0.1">
    <output name="output">

        <list name="summaries" description="Notable, concise facts summarizing the document. Each entry is a seperate fact">
            <string name="summary" description='Key fact or idea which helps summarize this document' />
        </list>

        <list name="questions" description="Interesting questions one could ask to understand the document. Each entry is a seperate question">
            <string name="question" />
        </list>

    </output>


    <prompt>
        Given the following document, gather the requested information.

        '{{document}}'

        @xml_prefix_prompt

        {output_schema}

        @complete_json_suffix_v2</prompt>

</rail>`;
