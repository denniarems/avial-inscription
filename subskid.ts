export default async function fetchSubsquid({ query, variables, network }) {
  const body = variables ? { query, variables } : { query };
  return fetch("https://squid.subsquid.io/avail-goldberg/graphql", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })
    .then((res) => res.json())
    .then((result) => result)
    .catch((e) => {
      console.error("error in fetchSubsquid : ", e);
    });
}
