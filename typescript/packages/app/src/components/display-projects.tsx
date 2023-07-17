import { Project } from "@fgpt/precedent-iso";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import ModeEditIcon from "@mui/icons-material/ModeEditOutlined";
import {
  Box,
  ButtonGroup,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Link,
  Typography,
} from "@mui/joy";
import React from "react";

export const DisplayProjects: React.FC<{
  openCreateProjects: () => void;
  projectsLoading: boolean;
  projects: Project[];
  setEditingProject: (projectId: string, projectName: string) => void;
  setDeletingProject: (projectId: string, projectName: string) => void;
}> = ({
  openCreateProjects,
  projectsLoading,
  projects,
  setEditingProject,
  setDeletingProject,
}) => {
  return (
    <Box display="flex" flexDirection="column" padding={2} gap={1}>
      <Typography level="h2">Deals</Typography>
      <Box
        display="flex"
        height="2px"
        width="100%"
        visibility={projectsLoading ? "visible" : "hidden"}
      >
        <LinearProgress sx={{ width: "100%" }} />
      </Box>

      <Box
        display="grid"
        gridTemplateColumns="repeat( auto-fit, 250px )"
        gridAutoRows="auto"
        gap="1rem"
      >
        <Box>
          <Card
            onClick={openCreateProjects}
            variant="outlined"
            sx={{
              width: "250px",
              height: "250px",
              padding: 0,

              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "rgba(0, 0, 0, 0.06) 0px 2px 4px",
              transition: "all .3s ease-in-out",
              "&:hover": {
                boxShadow: "rgba(0, 0, 0, 0.22) 0px 9px 21px",
                transform: "translate3d(0px, -1px, 0px)",
              },
            }}
          >
            <AddCircleOutlineOutlinedIcon />
            <Typography
              level="h2"
              fontSize="md"
              textAlign={"center"}
              sx={{ mb: 0.5 }}
            >
              Add a deal
            </Typography>
          </Card>
        </Box>
        {projects.map((project) => (
          <Box key={project.id}>
            <Card
              variant="outlined"
              sx={{
                width: "250px",
                height: "250px",
                padding: 0,
                transition: "all .3s ease-in-out",
                "&:hover": {
                  boxShadow: "rgba(0, 0, 0, 0.22) 0px 3px 6px",
                  transform: "translate3d(0px, -1px, 0px)",
                },
              }}
            >
              <Box
                display="flex"
                bgcolor="primary.900"
                flexDirection="column"
                color="neutral.50"
                padding={2}
                height="50%"
                justifyContent="center"
                borderRadius={"8px 8px 0 0"}
                sx={(theme) => ({
                  background: `linear-gradient(-45deg, ${theme.vars.palette.primary[900]}, ${theme.vars.palette.primary[500]})`,
                  fontWeight: "lg", // short-hand syntax, same as `theme.fontWeight.lg`
                })}
                href={`/projects/${project.id}`}
                component={Link}
              >
                <Typography
                  level="h1"
                  fontSize="md"
                  textAlign={"center"}
                  sx={{ mb: 0.5, color: "neutral.50" }}
                >
                  {project.name}
                </Typography>
              </Box>

              <CardContent
                orientation="horizontal"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingX: 2,
                }}
              >
                <Box display="flex" flexDirection="column">
                  <Typography level="body2" sx={{ mb: 0.5 }}>
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography level="body2" sx={{ mb: 0.5 }}>
                    {project.fileCount} assets
                  </Typography>
                </Box>

                <ButtonGroup sx={{ height: "32px" }}>
                  <IconButton
                    color="info"
                    onClick={() => setEditingProject(project.id, project.name)}
                  >
                    <ModeEditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="danger"
                    onClick={() => setDeletingProject(project.id, project.name)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ButtonGroup>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
