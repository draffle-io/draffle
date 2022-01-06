use anyhow::Result;
use draffle_cli::entrypoint::{entry, Opts};
use clap::Parser;

fn main() -> Result<()> {
    entry(Opts::parse())
}
